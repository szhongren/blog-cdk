import { Bucket } from "@aws-cdk/aws-s3";
import { Construct, Stack, StackProps } from "@aws-cdk/core";

export class DeploymentBucketStack extends Stack {
  deploymentBucket: Bucket;

  constructor(app: Construct, id: string, props?: StackProps) {
    super(app, id, props);

    this.deploymentBucket = new Bucket(this, "DeploymentBucket", {
      versioned: true,
      bucketName: "blog-deployment-bucket",
    });
  }
}
