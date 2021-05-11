import { Artifact } from "@aws-cdk/aws-codepipeline";
import {
  GitHubSourceAction,
  GitHubTrigger,
} from "@aws-cdk/aws-codepipeline-actions";
import { App, SecretValue, Stack, StackProps, Stage } from "@aws-cdk/core";
import { CdkPipeline, SimpleSynthAction } from "@aws-cdk/pipelines";
import { BlogStage } from "./blog-stage";
import { env } from "./config/env";

export class CdkPipelineStack extends Stack {
  constructor(app: App, id: string, props: StackProps) {
    super(app, id, props);

    const cdkSourceArtifact = new Artifact("CdkSourceArtifact");
    const cdkBuildArtifact = new Artifact("CdkBuildArtifact");

    const cdkSourceAction = new GitHubSourceAction({
      actionName: "GitHub",
      output: cdkSourceArtifact,
      oauthToken: SecretValue.secretsManager("github_oauth_token"),
      trigger: GitHubTrigger.POLL,
      owner: "szhongren",
      repo: "blog-cdk",
      branch: "main",
    });

    const cdkSynthAction = new SimpleSynthAction({
      installCommands: ["npm install"],
      synthCommand: "npm run cdk synth",
      sourceArtifact: cdkSourceArtifact,
      cloudAssemblyArtifact: cdkBuildArtifact,
    });

    const pipeline = new CdkPipeline(this, "CdkPipeline", {
      pipelineName: "BlogCdkPipeline",
      cloudAssemblyArtifact: cdkBuildArtifact,
      sourceAction: cdkSourceAction,
      synthAction: cdkSynthAction,
    });

    pipeline.addApplicationStage(new BlogStage(app, "Prod", { env }));
  }
}
