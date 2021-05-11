#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { PipelineStack } from "../lib/pipeline-stack";

const app = new cdk.App();

new PipelineStack(app, "CdkPipelineStack", {
  env: {
    account: "636584431701",
    region: "us-east-1",
  },
});

app.synth();
