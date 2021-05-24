import { OriginAccessIdentity } from "@aws-cdk/aws-cloudfront";
import { PolicyStatement } from "@aws-cdk/aws-iam";
import { BlockPublicAccess, Bucket, HttpMethods } from "@aws-cdk/aws-s3";
import { Construct, Stack, StackProps } from "@aws-cdk/core";

export class DeploymentBucketStack extends Stack {
  deploymentBucket: Bucket;
  cloudfrontBucket: Bucket;
  cloudfrontOAI: any;

  constructor(app: Construct, id: string, props?: StackProps) {
    super(app, id, props);

    this.deploymentBucket = new Bucket(this, "DeploymentBucket", {
      versioned: true,
      bucketName: "blog-deployment-bucket",
    });

    this.cloudfrontBucket = new Bucket(this, "CloudfrontBucket", {
      versioned: true,
      bucketName: "blog-cloudfront-bucket",
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedOrigins: ["*"],
          allowedMethods: [HttpMethods.GET],
          maxAge: 3000,
        },
      ],
    });

    this.cloudfrontOAI = new OriginAccessIdentity(this, "CloudfrontOAI", {
      comment: `Allows CloudFront access to S3 bucket`,
    });

    this.cloudfrontBucket.addToResourcePolicy(
      new PolicyStatement({
        sid: "Grant Cloudfront Origin Access Identity access to S3 bucket",
        actions: ["s3:GetObject"],
        resources: [this.cloudfrontBucket.bucketArn + "/*"],
        principals: [this.cloudfrontOAI.grantPrincipal],
      })
    );
  }
}
