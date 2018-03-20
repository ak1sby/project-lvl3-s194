
run:
	npm run babel-node -- 'src/bin/pageLoader.js'

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


