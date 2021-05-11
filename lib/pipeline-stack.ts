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
