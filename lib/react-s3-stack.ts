import { Bucket } from "@aws-cdk/aws-s3";
import { BucketDeployment, Source } from "@aws-cdk/aws-s3-deployment";
import { Construct, Stack, StackProps } from "@aws-cdk/core";

export class ReactS3Stack extends Stack {
  reactBucket: Bucket;

  constructor(app: Construct, id: string, props?: StackProps) {
    super(app, id, props);

    this.reactBucket = new Bucket(this, "DeploymentBucket", {
      versioned: true,
      bucketName: "BlogDeploymentBucket",
    });
  }
}
