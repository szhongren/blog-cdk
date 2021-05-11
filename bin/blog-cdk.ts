#!/usr/bin/env node
import "source-map-support/register";
import { App } from "@aws-cdk/core";
import { CdkPipelineStack } from "../lib/pipeline-stack";
import { env } from "../lib/config/env";

const app = new App();

new CdkPipelineStack(app, "BlogCdkPipelineStack", {
  env,
});

app.synth();
