import { HttpApi, HttpMethod } from "@aws-cdk/aws-apigatewayv2";
import { LambdaProxyIntegration } from "@aws-cdk/aws-apigatewayv2-integrations";
import { DnsValidatedCertificate } from "@aws-cdk/aws-certificatemanager";
import {
  CloudFrontAllowedMethods,
  CloudFrontWebDistribution,
  OriginAccessIdentity,
  PriceClass,
  SecurityPolicyProtocol,
  SSLMethod,
  ViewerProtocolPolicy,
} from "@aws-cdk/aws-cloudfront";
import { PolicyStatement } from "@aws-cdk/aws-iam";
import { Runtime } from "@aws-cdk/aws-lambda";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { ARecord, HostedZone, RecordTarget } from "@aws-cdk/aws-route53";
import { CloudFrontTarget } from "@aws-cdk/aws-route53-targets";
import { BlockPublicAccess, Bucket, HttpMethods } from "@aws-cdk/aws-s3";
import { BucketDeployment, Source } from "@aws-cdk/aws-s3-deployment";
import { Construct, Duration, Stack, StackProps } from "@aws-cdk/core";

export interface StaticSiteStackProps extends StackProps {
  deploymentBucket: Bucket;
}

export class StaticSiteStack extends Stack {
  constructor(app: Construct, id: string, props: StaticSiteStackProps) {
    super(app, id, props);

    const httpApi = new HttpApi(this, "ApiGateway");

    const helloWorldLambda = new NodejsFunction(this, "HelloWorldLambda", {
      entry: `${__dirname}/backend/index.ts`,
      handler: "handler",
      runtime: Runtime.NODEJS_12_X,
    });

    const lambdaIntegration = new LambdaProxyIntegration({
      handler: helloWorldLambda,
    });

    httpApi.addRoutes({
      path: "/api/helloworld", // You must include the `/api/` since CloudFront will not truncate it
      methods: [HttpMethod.GET],
      integration: lambdaIntegration,
    });

    const [cloudfrontBucket, cloudfrontOAI] = this.setUpCloudfrontBucket(props);

    const domainName = "shaoz.io";

    const hostedZone = HostedZone.fromLookup(this, "HostedZone", {
      domainName: domainName,
    });

    // TLS certificate
    const certificateArn = new DnsValidatedCertificate(
      this,
      "SiteCertificate",
      {
        domainName: domainName,
        hostedZone: hostedZone,
        region: "us-east-1", // Cloudfront only checks this region for certificates.
      }
    ).certificateArn;

    const cloudfrontDistribution = new CloudFrontWebDistribution(
      this,
      "CloudfrontDistribution",
      {
        comment: "CDN for Web App",
        defaultRootObject: "index.html",
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        priceClass: PriceClass.PRICE_CLASS_ALL,
        aliasConfiguration: {
          acmCertRef: certificateArn,
          names: [domainName],
          sslMethod: SSLMethod.SNI,
          securityPolicy: SecurityPolicyProtocol.TLS_V1_1_2016,
        },
        originConfigs: [
          {
            // make sure your backend origin is first in the originConfigs list so it takes precedence over the S3 origin
            customOriginSource: {
              domainName: `${httpApi.httpApiId}.execute-api.${this.region}.amazonaws.com`,
            },
            behaviors: [
              {
                pathPattern: "/api/*", // CloudFront will forward `/api/*` to the backend so make sure all your routes are prepended with `/api/`
                allowedMethods: CloudFrontAllowedMethods.ALL,
                defaultTtl: Duration.seconds(0),
                forwardedValues: {
                  queryString: true,
                  headers: ["Authorization"], // By default CloudFront will not forward any headers through so if your API needs authentication make sure you forward auth headers across
                },
              },
            ],
          },
          {
            s3OriginSource: {
              s3BucketSource: cloudfrontBucket,
              originAccessIdentity: cloudfrontOAI,
            },
            behaviors: [
              {
                compress: true,
                isDefaultBehavior: true,
                defaultTtl: Duration.seconds(0),
                allowedMethods: CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
              },
            ],
          },
        ],
      }
    );

    // Route53 alias record for the CloudFront distribution
    new ARecord(this, "SiteARecord", {
      recordName: domainName,
      target: RecordTarget.fromAlias(
        new CloudFrontTarget(cloudfrontDistribution)
      ),
      zone: hostedZone,
    });
  }

  private setUpCloudfrontBucket(
    props: StaticSiteStackProps
  ): [Bucket, OriginAccessIdentity] {
    const cloudfrontBucket = new Bucket(this, "CloudfrontBucket", {
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

    new BucketDeployment(this, "Deployment", {
      sources: [Source.bucket(props.deploymentBucket, "latest")],
      destinationBucket: cloudfrontBucket,
    });

    const cloudfrontOAI = new OriginAccessIdentity(this, "CloudfrontOAI", {
      comment: `Allows CloudFront access to S3 bucket`,
    });

    cloudfrontBucket.addToResourcePolicy(
      new PolicyStatement({
        sid: "Grant Cloudfront Origin Access Identity access to S3 bucket",
        actions: ["s3:GetObject"],
        resources: [cloudfrontBucket.bucketArn + "/*"],
        principals: [cloudfrontOAI.grantPrincipal],
      })
    );

    return [cloudfrontBucket, cloudfrontOAI];
  }
}
