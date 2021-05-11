#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { CdkPipelineStack } from "../lib/pipeline-stack";

const app = new cdk.App();

new CdkPipelineStack(app, "BlogCdkPipelineStack", {
  env: {
    account: "636584431701",
    region: "us-east-1",
  },
});

app.synth();
