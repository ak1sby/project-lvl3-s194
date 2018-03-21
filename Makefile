
run:
	 npm run babel-node -- src/bin/pageLoader.js --output /mnt/d/hexlet/pageDownloader https://hexlet.io/courses

install:
	npm install

build:
	rm -rf dist
	npm run build

test:
	npm test

lint:
	npm run eslint .

publish:
	npm publish

debug:
	DEBUG="page-loader:*" npm run babel-node -- src/bin/pageLoader.js --output /mnt/d/hexlet/pageDownloader https://hexlet.io/courses

debugTest:
	DEBUG="page-loader:*" npm run babel-node -- src/bin/pageLoader.js --output /mnt/d/hexlet/pageDownloader https://hexlet.io/courses


