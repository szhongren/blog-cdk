import { Bucket } from "@aws-cdk/aws-s3";
import { BucketDeployment, Source } from "@aws-cdk/aws-s3-deployment";
import { Construct, Stack, StackProps } from "@aws-cdk/core";

export class ReactS3Stack extends Stack {
  reactBucket: Bucket;

  constructor(app: Construct, id: string, props?: StackProps) {
    super(app, id, props);

    this.reactBucket = new Bucket(this, "DeploymentBucket", {
      versioned: true,
      bucketName: "blog-deployment-bucket",
    });

    const cloudfrontBucket = new Bucket(this, "CloudfrontBucket", {
      versioned: true,
      bucketName: "blog-cloudfront-bucket",
      publicReadAccess: true,
      websiteIndexDocument: "index.html",
    });

    new BucketDeployment(this, "Deployment", {
      sources: [Source.bucket(this.reactBucket, "latest")],
      destinationBucket: cloudfrontBucket,
    });
  }
}
