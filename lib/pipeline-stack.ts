import {
  BuildSpec,
  LinuxBuildImage,
  PipelineProject,
} from "@aws-cdk/aws-codebuild";
import { Artifact, Pipeline } from "@aws-cdk/aws-codepipeline";
import {
  CloudFormationCreateUpdateStackAction,
  CodeBuildAction,
  GitHubSourceAction,
  GitHubTrigger,
} from "@aws-cdk/aws-codepipeline-actions";
import { App, SecretValue, Stack, StackProps } from "@aws-cdk/core";
import { CdkPipeline, SimpleSynthAction } from "@aws-cdk/pipelines";

export class PipelineStack extends Stack {
  constructor(app: App, id: string, props: StackProps) {
    super(app, id, props);

    // const cdkBuild = new PipelineProject(this, "CdkBuild", {
    //   buildSpec: BuildSpec.fromObject({
    //     version: "0.2",
    //     phases: {
    //       install: {
    //         commands: "npm install",
    //       },
    //       build: {
    //         commands: ["npm run build", "npm run cdk synth -- -o dist"],
    //       },
    //     },
    //     artifacts: {
    //       "base-directory": "dist",
    //       files: ["LambdaStack.template.json"],
    //     },
    //   }),
    //   environment: {
    //     buildImage: LinuxBuildImage.STANDARD_5_0,
    //   },
    // });

    const cdkSourceArtifact = new Artifact("CdkSourceArtifact");
    const cdkBuildArtifact = new Artifact("CdkBuildArtifact");

    const cdkSourceAction = new GitHubSourceAction({
      actionName: "GitHub",
      output: cdkSourceArtifact,
      oauthToken: SecretValue.secretsManager("github_oauth_token"),
      trigger: GitHubTrigger.POLL,
      owner: "szhongren",
      repo: "blog-cdk",
    });

    const cdkSynthAction = SimpleSynthAction.standardNpmSynth({
      sourceArtifact: cdkSourceArtifact,
      cloudAssemblyArtifact: cdkBuildArtifact,
    });

    const pipeline = new CdkPipeline(this, "CdkPipeline", {
      pipelineName: "BlogCdkPipeline",
      cloudAssemblyArtifact: cdkBuildArtifact,
      sourceAction: cdkSynthAction,
      synthAction: cdkSynthAction,
    });

    // const cdkSynthAction = new Simple
    // new Pipeline(this, "Pipeline", {
    //   stages: [
    //     {
    //       stageName: "Source",
    //       actions: [cdkAction],
    //     },
    //     {
    //       stageName: "Build",
    //       actions: [
    //         new CodeBuildAction({
    //           actionName: "CDK_Build",
    //           project: cdkBuild,
    //           input: cdkSourceArtifact,
    //           outputs: [cdkBuildArtifact],
    //         }),
    //       ],
    //     },
    //     {
    //       stageName: "Deploy",
    //       actions: [
    //         new CloudFormationCreateUpdateStackAction({
    //           actionName: "Lambda_CFN_Deploy",
    //           templatePath: cdkBuildArtifact.atPath(
    //             "LambdaStack.template.json"
    //           ),
    //           stackName: "LambdaDeploymentStack",
    //           adminPermissions: true,
    //         }),
    //       ],
    //     },
    //   ],
    // });
  }
}
