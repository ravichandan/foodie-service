import {
  DeleteObjectCommand,
  DeleteObjectsCommand, GetObjectCommand,
  ListBucketsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Logger } from 'log4js';
import * as Utils from '../utils/Utils';
import { Upload } from '@aws-sdk/lib-storage';

import { readFileSync } from 'node:fs';
import { Stream } from 'node:stream';
import { Readable } from 'stream';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const log: Logger = Utils.getLogger('r2.provider');

export class R2Provider {
  private client;

  private S3_BUCKET_NAME = 'test-bucket';

  constructor() {
    // First create a client.
    // A client can be shared by different commands.
    this.client = new S3Client({
      region: 'APAC',
      tls: false,
      // endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
      endpoint: `https://8a38bed39f846ed889c3ea56f623a0c4.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: '1195528d67dc729ebd8e912db877dc22',
        secretAccessKey: '615e3b74c4f4b41365be65cca0f50cadc275df1961b10c317c2eeab2ca78a41a',
      },
    });
  }

  async listBuckets() {
    log.debug('In listBuckets');
    const params = {
      /** input parameters */
    };
    const command = new ListBucketsCommand(params);
    return await this.client.send(command);
  }

  async putFile() {
    const putObjectCommand = new PutObjectCommand({
      Bucket: this.S3_BUCKET_NAME,
      Key: 'KKeyy',
      Body: JSON.stringify({ name: 'Chandan' }),
    });

    this.client.send(putObjectCommand);
  }

  async removeFile(key: string) {
    log.info(' in r2.provider, removeFile(), key:: ', key);
    const url = await getSignedUrl(
      this.client,
      new DeleteObjectCommand({ Bucket: this.S3_BUCKET_NAME, Key: key }),
      { expiresIn: 3600 }
    );
    await fetch(url, {
      method: 'DELETE',
    });

    // const deleteObjectCommand = new DeleteObjectCommand({
    //   Bucket: this.S3_BUCKET_NAME,
    //   Key: key,
    // });

    // await this.client.send(deleteObjectCommand);
  }

  async uploadToR2(passThroughStream: any) {
    return new Promise((resolve, reject) => {
      const putObjectCommand = new PutObjectCommand({
        Bucket: this.S3_BUCKET_NAME,
        Key: 'some-key',
        Body: passThroughStream,
        ContentLength: passThroughStream.readableLength, // include this new field!!
      });
      this.client.send(putObjectCommand).then((_) => resolve(true));
    });
  }

  async getSignedUrl(key: string){
    // console.log(
      return await getSignedUrl(this.client, new GetObjectCommand({Bucket: this.S3_BUCKET_NAME, Key: key}), { expiresIn: 3600 })
    // )
  }
  async uploadFileForCustomer(customerId: string, fileStream: any) {
    let key = '';
    // const fileName = filePath.split('\\').pop().split('/').pop();

    key = `${customerId}-${Math.trunc(Math.random() * 10000)}-${new Date().getTime().toString()}`;
    return this.uploadV3(key, fileStream);
  }

  async uploadFileToBucket(key: string, fileStream: any, readableLength?: any) {
    console.log(`Uploading file from ${key}, ${readableLength}\n`);

    log.trace('In uploadFileToBucket:: , fileStream.readableLength ', fileStream.readableLength);

    const putObjectCommand = new PutObjectCommand({
      Bucket: this.S3_BUCKET_NAME,
      Body: fileStream,
      Key: key,
      ContentLength: fileStream.readableLength,
      ACL: 'bucket-owner-full-control',
      // ContentType: "multipart/form-data",
      ContentType: 'text/plain',
    });

    const uploadedResult = await this.client.send(putObjectCommand);
    console.log(`${key} uploaded successfully. uploadedResult:: `, uploadedResult);
    return uploadedResult;
  }

  async uploadV3(key: any, fileStream: ReadableStream) {
    log.trace('in uploadv3');
    const target = {
      Bucket: this.S3_BUCKET_NAME,
      Key: key,
      Body: fileStream,
    };
    try {
      const parallelUploads3 = new Upload({
        client: this.client,
        tags: [], // optional tags
        queueSize: 4, // optional concurrency configuration
        leavePartsOnError: false, // optional manually handle dropped parts
        params: target,
      });

      parallelUploads3.on('httpUploadProgress', (progress) => {
        console.log(progress);
      });

      console.log('this.getSignedUrl(key)', await this.getSignedUrl(key));
      return await parallelUploads3.done();
    } catch (e) {
      console.log(e);
    }
  }
}

export const r2Provider = new R2Provider();
