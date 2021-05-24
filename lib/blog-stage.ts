import { Construct, Stage, StageProps } from "@aws-cdk/core";
import { StaticSitePipelineStack } from "./static-site-pipeline-stack";
import { StaticSiteStack } from "./static-site-stack";
import { DeploymentBucketStack } from "./deployment-bucket-stack";

export class BlogStage extends Stage {
  deploymentBucketStack: DeploymentBucketStack;
  reactPipelineStack: StaticSitePipelineStack;
  staticSiteStack: StaticSiteStack;

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    this.deploymentBucketStack = new DeploymentBucketStack(
      this,
      "DeploymentBucketStack"
    );

    this.reactPipelineStack = new StaticSitePipelineStack(
      this,
      "StaticSitePipelineStack",
      {
        deploymentBucket: this.deploymentBucketStack.deploymentBucket,
        cloudfrontBucket: this.deploymentBucketStack.cloudfrontBucket,
      }
    );

    this.staticSiteStack = new StaticSiteStack(this, "StaticSiteStack", {
      deploymentBucket: this.deploymentBucketStack.deploymentBucket,
      cloudfrontBucket: this.deploymentBucketStack.cloudfrontBucket,
      cloudfrontOAI: this.deploymentBucketStack.cloudfrontOAI,
    });
  }
}
