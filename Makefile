
run:
	 npm run babel-node -- src/bin/Start.js --output /mnt/d/hexlet/pageDownloader https://ru.hexlet.io/courses

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
	DEBUG="page-loader:*" npm run babel-node -- src/bin/Start.js --output /mnt/d/hexlet/pageDownloader  https://ru.hexlet.io/courses

debugTest:
	DEBUG="page-loader:*" DEBUG="page-loader:*" npm test


