import multer from 'multer';
import forge from 'node-forge';
import Keystore from '../models/Keystore.js';
import { uploadBufferToS3, getPresignedUrl, deleteFromS3 } from '../services/s3Service.js';
import { AppError } from '../middleware/errorHandler.js';

const storage = multer.memoryStorage();
export const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

function generateKeystoreBuffer({ alias, keystorePassword, commonName, organization }) {
  return new Promise((resolve, reject) => {
    forge.pki.rsa.generateKeyPair({ bits: 2048, workers: -1 }, (err, keypair) => {
      if (err) return reject(err);
      try {
        const cert = forge.pki.createCertificate();
        cert.publicKey = keypair.publicKey;
        cert.serialNumber = Date.now().toString(16);
        cert.validity.notBefore = new Date();
        cert.validity.notAfter = new Date();
        cert.validity.notAfter.setDate(cert.validity.notBefore.getDate() + 10000);

        const attrs = [
          { name: 'commonName', value: commonName },
          { name: 'organizationName', value: organization },
          { name: 'countryName', value: 'US' },
        ];
        cert.setSubject(attrs);
        cert.setIssuer(attrs);
        cert.sign(keypair.privateKey, forge.md.sha256.create());

        const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keypair.privateKey, [cert], keystorePassword, {
          friendlyName: alias,
          algorithm: '3des',
        });
        const p12Der = forge.asn1.toDer(p12Asn1);
        resolve(Buffer.from(p12Der.getBytes(), 'binary'));
      } catch (e) {
        reject(e);
      }
    });
  });
}

export async function uploadKeystore(req, res) {
  if (!req.file) throw new AppError('No keystore file provided', 400);
  const { projectId, projectName, provider, keystoreAlias, keystorePassword, keyPassword, firebaseAppId, firebaseCliToken } = req.body;

  const projectIdStr = String(projectId);
  const s3Key = `keystores/${req.user._id}/${projectIdStr}/${Date.now()}_${req.file.originalname}`;
  await uploadBufferToS3({ key: s3Key, buffer: req.file.buffer, contentType: 'application/octet-stream' });

  const ks = await Keystore.findOneAndUpdate(
    { userId: req.user._id, projectId: projectIdStr },
    { projectName, provider, keystoreS3Key: s3Key, keystoreAlias, keystorePassword, keyPassword, firebaseAppId, firebaseCliToken, originalFilename: req.file.originalname, uploadedAt: new Date() },
    { upsert: true, new: true }
  );

  res.json({ keystore: { id: ks._id, projectId: ks.projectId, projectName: ks.projectName, filename: ks.originalFilename, uploadedAt: ks.uploadedAt } });
}

export async function generateKeystore(req, res) {
  const { projectId, projectName, provider, keystoreAlias, keystorePassword, keyPassword, firebaseCliToken, commonName, organization } = req.body;

  if (!projectId || !projectName || !keystoreAlias || !keystorePassword || !keyPassword) {
    throw new AppError('Missing required parameters for keystore generation', 400);
  }

  const projectIdStr = String(projectId);
  const originalFilename = `${projectName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_release.keystore`;
  const cn = commonName || 'BuildPortal';
  const org = organization || 'MobileBuildPortal';

  try {
    const buffer = await generateKeystoreBuffer({ alias: keystoreAlias, keystorePassword, commonName: cn, organization: org });

    const s3Key = `keystores/${req.user._id}/${projectIdStr}/${Date.now()}_${originalFilename}`;
    await uploadBufferToS3({ key: s3Key, buffer, contentType: 'application/octet-stream' });

    const ks = await Keystore.findOneAndUpdate(
      { userId: req.user._id, projectId: projectIdStr },
      { projectName, provider, keystoreS3Key: s3Key, keystoreAlias, keystorePassword, keyPassword, firebaseAppId: '', firebaseCliToken, originalFilename, uploadedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({ keystore: { id: ks._id, projectId: ks.projectId, projectName: ks.projectName, filename: ks.originalFilename, uploadedAt: ks.uploadedAt } });
  } catch (err) {
    throw new AppError(`Failed to generate keystore: ${err.message}`, 500);
  }
}

export async function getKeystore(req, res) {
  const { projectId } = req.params;
  const ks = await Keystore.findOne({ userId: req.user._id, projectId: String(projectId) });
  if (!ks) return res.json({ keystore: null });
  res.json({ keystore: { id: ks._id, projectId: ks.projectId, projectName: ks.projectName, filename: ks.originalFilename, uploadedAt: ks.updatedAt, firebaseAppId: ks.firebaseAppId, firebaseCliToken: ks.firebaseCliToken } });
}

export async function listKeystores(req, res) {
  const ks = await Keystore.find({ userId: req.user._id }).select('-keystorePassword -keyPassword');
  res.json({ keystores: ks });
}

export async function downloadKeystore(req, res) {
  const { projectId } = req.params;
  const ks = await Keystore.findOne({ userId: req.user._id, projectId: String(projectId) });
  if (!ks) throw new AppError('Keystore not found', 404);
  const url = await getPresignedUrl(ks.keystoreS3Key, 300);
  res.json({ url, filename: ks.originalFilename });
}

export async function deleteKeystore(req, res) {
  const { projectId } = req.params;
  const ks = await Keystore.findOneAndDelete({ userId: req.user._id, projectId: String(projectId) });
  if (!ks) throw new AppError('Keystore not found', 404);
  if (ks.keystoreS3Key) {
    try { await deleteFromS3(ks.keystoreS3Key); } catch (_) { /* S3 cleanup best-effort */ }
  }
  res.json({ success: true });
}

export async function updateFirebaseConfig(req, res) {
  const { projectId, firebaseCliToken } = req.body;
  if (!projectId) throw new AppError('Missing projectId', 400);

  const ks = await Keystore.findOneAndUpdate(
    { userId: req.user._id, projectId: String(projectId) },
    { firebaseCliToken },
    { new: true }
  );

  if (!ks) throw new AppError('No keystore found for this project. Upload a keystore first.', 404);

  res.json({ keystore: { id: ks._id, projectId: ks.projectId, projectName: ks.projectName, filename: ks.originalFilename, uploadedAt: ks.updatedAt, firebaseCliToken: ks.firebaseCliToken } });
}