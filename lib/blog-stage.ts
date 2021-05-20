import { Construct, Stage, StageProps } from "@aws-cdk/core";
import { ReactS3Stack } from "./react-s3-stack";

export class BlogStage extends Stage {
  reactS3Stack: ReactS3Stack;

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    this.reactS3Stack = new ReactS3Stack(this, "ReactS3Stack");
  }
}
