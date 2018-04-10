
run:
	 npm run babel-node -- src/bin/start.js --output /mnt/d/hexlet/test https://ru.hexlet.io/courses --depth 1
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
	DEBUG="page-loader:*" npm run babel-node -- src/bin/start.js --output /mnt/d/hexlet/pageDownloader https://ru.hexlet.io/courses/introduction_to_c

debugTest:
	DEBUG="page-loader:*" DEBUG="page-loader:*" npm test

test-coverage:
	npm test -- --coverage

