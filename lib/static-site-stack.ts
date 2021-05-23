import { DnsValidatedCertificate } from "@aws-cdk/aws-certificatemanager";
import {
  CloudFrontWebDistribution,
  SecurityPolicyProtocol,
  SSLMethod,
} from "@aws-cdk/aws-cloudfront";
import { Code, Function } from "@aws-cdk/aws-lambda";
import { HostedZone } from "@aws-cdk/aws-route53";
import { Bucket } from "@aws-cdk/aws-s3";
import { BucketDeployment, Source } from "@aws-cdk/aws-s3-deployment";
import { Construct, Stack, StackProps } from "@aws-cdk/core";

export class StaticSiteStack extends Stack {
  staticSiteBucket: Bucket;

  constructor(app: Construct, id: string, props?: StackProps) {
    super(app, id, props);

    let siteDomain = "shaoz.io";

    const hostedZone = HostedZone.fromLookup(this, "shaoz.io", {
      domainName: siteDomain,
    });

    this.staticSiteBucket = new Bucket(this, "DeploymentBucket", {
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
      sources: [Source.bucket(this.staticSiteBucket, "latest")],
      destinationBucket: cloudfrontBucket,
    });
  }
}
