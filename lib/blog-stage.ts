import { Construct, Stage, StageProps } from "@aws-cdk/core";
import { ReactS3Stack } from "./react-s3-stack";

export class BlogStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const reactS3Stack = new ReactS3Stack(this, "ReactS3Stack");
  }
}
