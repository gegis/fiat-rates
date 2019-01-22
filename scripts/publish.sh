#!/bin/bash

git push github master develop
git push github --tags
npm publish

echo "Done."

