# This is a CDK project to try writing some overkill infra for a blog

[This is the domain]{https://shaoz.io}

## How this works

Domain directs to a Cloudfront distribution

Cloudfront distribution has 2 origins

1. Directs to an S3 bucket where I have my static site resources (a React website).
2. Directs to an API Gateway where I have my lambdas that implement logic.

To deploy my static site, I have a pipeline deployed that builds and puts the static site resources in the S3 bucket that I read from, every time I commit to my [Github repo]{https://github.com/szhongren/blog-react}.

In deploying my static site, I also keep a record of all previous builds, in another S3 bucket.
