import { Project, BuildSpec } from "@aws-cdk/aws-codebuild";
import { Artifact, Pipeline } from "@aws-cdk/aws-codepipeline";
import {
  GitHubSourceAction,
  GitHubTrigger,
  CodeBuildAction,
  S3DeployAction,
} from "@aws-cdk/aws-codepipeline-actions";
import { Bucket } from "@aws-cdk/aws-s3";
import { Construct, SecretValue, Stage, StageProps } from "@aws-cdk/core";
import { ReactS3Stack } from "./react-s3-stack";

export interface ReactPipelineStageProps extends StageProps {
  reactBucket: Bucket;
}

export class ReactPipelineStage extends Stage {
  reactS3Stack: ReactS3Stack;

  constructor(scope: Construct, id: string, props: ReactPipelineStageProps) {
    super(scope, id, props);

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

    const reactBuildAction = new CodeBuildAction({
      actionName: "Build",
      input: reactSourceArtifact,
      outputs: [reactBuildArtifact],
      project: new Project(this, "ReactBuildProject", {
        buildSpec: BuildSpec.fromObject({
          version: "0.2",
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
      }),
    });

    const s3DeployAction = new S3DeployAction({
      actionName: "S3 Deploy",
      input: reactBuildArtifact,
      bucket: props.reactBucket,
      objectKey: "{datetime}",
    });

    const reactPipeline = new Pipeline(this, "ReactPipeline", {
      pipelineName: "ReactPipeline",
      stages: [
        { stageName: "Source", actions: [reactSourceAction] },
        { stageName: "Build", actions: [reactBuildAction] },
        { stageName: "Deploy", actions: [s3DeployAction] },
      ],
    });
  }
}
