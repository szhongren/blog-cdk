import { Construct, Stage, StageProps } from "@aws-cdk/core";
import { StaticSitePipelineStack as StaticSitePipelineStack } from "./static-site-pipeline-stack";
import { StaticSiteStack } from "./static-site-stack";

export class BlogStage extends Stage {
  staticSiteStack: StaticSiteStack;
  reactPipelineStack: StaticSitePipelineStack;

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    this.staticSiteStack = new StaticSiteStack(this, "StaticSiteStack");

    this.reactPipelineStack = new StaticSitePipelineStack(
      this,
      "StaticSitePipelineStack",
      { staticSiteBucket: this.staticSiteStack.staticSiteBucket }
    );
  }
}
