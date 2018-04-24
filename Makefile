TESTS = test/*.js
REPORTER = spec
TIMEOUT = 20000
ISTANBUL = ./node_modules/.bin/istanbul
ESLINT = ./node_modules/.bin/eslint
MOCHA = ./node_modules/mocha/bin/_mocha
COVERALLS = ./node_modules/coveralls/bin/coveralls.js

lint:
	@$(ESLINT) --fix lib

test:
	@NODE_ENV=test $(MOCHA) -R $(REPORTER) -t $(TIMEOUT) \
		$(MOCHA_OPTS) \
		$(TESTS)

test-cov:
	@$(ISTANBUL) cover --report html $(MOCHA) -- -t $(TIMEOUT) -R spec $(TESTS)

test-coveralls: lint
	@$(ISTANBUL) cover --report lcovonly $(MOCHA) -- -t $(TIMEOUT) -R spec $(TESTS)
	@echo TRAVIS_JOB_ID $(TRAVIS_JOB_ID)
	@cat ./coverage/lcov.info | $(COVERALLS) && rm -rf ./coverage

test-all: test test-coveralls

.PHONY: test
