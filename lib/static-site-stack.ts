import { Bucket } from "@aws-cdk/aws-s3";
import { BucketDeployment, Source } from "@aws-cdk/aws-s3-deployment";
import { Construct, Stack, StackProps } from "@aws-cdk/core";

export interface StaticSiteStackProps extends StackProps {
  deploymentBucket: Bucket;
}

export class StaticSiteStack extends Stack {
  constructor(app: Construct, id: string, props: StaticSiteStackProps) {
    super(app, id, props);

    const cloudfrontBucket = new Bucket(this, "CloudfrontBucket", {
      versioned: true,
      bucketName: "blog-cloudfront-bucket",
      publicReadAccess: true,
      websiteIndexDocument: "index.html",
    });

    new BucketDeployment(this, "Deployment", {
      sources: [Source.bucket(props.deploymentBucket, "latest")],
      destinationBucket: cloudfrontBucket,
    });
  }
}
