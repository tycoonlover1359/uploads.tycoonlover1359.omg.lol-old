import { GetObjectCommand, GetObjectCommandOutput , NoSuchKey, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

/**
 * A controller class for Amazon S3 to make interactions easier
 */
export class S3Handler {
    /**
     * The S3 client to use
     */
    public readonly client: S3Client;
    
    /**
     * The bucket to interact with
     */
    public readonly bucket: string;

    /**
     * Instantiates a new `S3Handler` object
     * 
     * @param bucket The bucket to interact with
     * @param region The region to use
     */
    constructor(bucket: string, region?: string) {
        this.client = new S3Client({ region: region || "us-east-1" });
        this.bucket = bucket;
    }

    /**
     * Get an object from the bucket
     * 
     * @param key The key of the object to get
     * @returns The response from S3
     * @throws `NoSuchKey` when the key does not exist in the bucket
     */
    public async getObject(key: string): Promise<GetObjectCommandOutput> {
        const response = await this.client.send(new GetObjectCommand({
            Bucket: this.bucket,
            Key: key
        }));
        return response;
    }
}

