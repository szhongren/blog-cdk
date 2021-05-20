import { Construct, Stage, StageProps } from "@aws-cdk/core";
import { ReactPipelineStack } from "./react-pipeline-stack";
import { ReactS3Stack } from "./react-s3-stack";

export class BlogStage extends Stage {
  reactS3Stack: ReactS3Stack;
  reactPipelineStack: ReactPipelineStack;

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    this.reactS3Stack = new ReactS3Stack(this, "ReactS3Stack");

    this.reactPipelineStack = new ReactPipelineStack(
      this,
      "ReactPipelineStack",
      { reactBucket: this.reactS3Stack.reactBucket }
    );
  }
}
