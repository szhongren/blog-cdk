import { BuildSpec, Project } from "@aws-cdk/aws-codebuild";
import { Artifact, Pipeline } from "@aws-cdk/aws-codepipeline";
import {
  GitHubSourceAction,
  GitHubTrigger,
  CodeBuildAction,
  S3DeployAction,
} from "@aws-cdk/aws-codepipeline-actions";
import {
  AccountRootPrincipal,
  CompositePrincipal,
  Role,
  ServicePrincipal,
} from "@aws-cdk/aws-iam";
import { Bucket } from "@aws-cdk/aws-s3";
import { BucketDeployment, Source } from "@aws-cdk/aws-s3-deployment";
import { Construct, SecretValue, Stack, StackProps } from "@aws-cdk/core";

export interface StaticSitePipelineStackProps extends StackProps {
  cloudfrontBucket: Bucket;
  deploymentBucket: Bucket;
}

export class StaticSitePipelineStack extends Stack {
  constructor(app: Construct, id: string, props: StaticSitePipelineStackProps) {
    super(app, id, props);

    const reactSourceArtifact = new Artifact("ReactSourceArtifact");
    const reactBuildArtifact = new Artifact("ReactBuildArtifact");

    const reactSourceAction = new GitHubSourceAction({
      actionName: "GitHub",
      output: reactSourceArtifact,
      oauthToken: SecretValue.secretsManager("github_oauth_token"),
      trigger: GitHubTrigger.POLL,
      owner: "szhongren",
      repo: "blog-react",
      branch: "main",
    });

    const reactBuildActionProjectRole = new Role(
      this,
      "ReactBuildActionProjectRole",
      {
        assumedBy: new CompositePrincipal(
          new AccountRootPrincipal(),
          new ServicePrincipal("codebuild.amazonaws.com")
        ),
      }
    );

    props.deploymentBucket.grantReadWrite(reactBuildActionProjectRole);

    const reactBuildAction = new CodeBuildAction({
      actionName: "Build",
      input: reactSourceArtifact,
      outputs: [reactBuildArtifact],
      role: reactBuildActionProjectRole,
      project: new Project(this, "ReactBuildProject", {
        buildSpec: BuildSpec.fromObject({
          version: "0.2",
          env: {
            variables: {
              ARTIFACTS_BUCKET: props.deploymentBucket.bucketName,
            },
          },
          phases: {
            build: {
              commands: ["npm install", "npm run build"],
            },
          },
          artifacts: {
            files: "**/*",
            "base-directory": "build",
          },
        }),
        role: reactBuildActionProjectRole,
      }),
    });

    const s3DeployAction = new S3DeployAction({
      actionName: "S3Deploy",
      input: reactBuildArtifact,
      bucket: props.deploymentBucket,
      objectKey: "{datetime}",
    });

    const latestS3DeployAction = new S3DeployAction({
      actionName: "LatestS3Deploy",
      input: reactBuildArtifact,
      bucket: props.deploymentBucket,
      objectKey: "latest",
      extract: false,
    });

    const staticSitePipeline = new Pipeline(this, "StaticSitePipeline", {
      stages: [
        { stageName: "Source", actions: [reactSourceAction] },
        { stageName: "Build", actions: [reactBuildAction] },
        {
          stageName: "Deploy",
          actions: [s3DeployAction, latestS3DeployAction],
        },
      ],
    });

    new BucketDeployment(this, "Deployment", {
      sources: [Source.bucket(props.deploymentBucket, "latest")],
      destinationBucket: props.cloudfrontBucket,
    });
  }
}
