REPORTER = dot

test:
	@./node_modules/.bin/jasmine

test-cov:
	@./node_modules/.bin/istanbul cover ./node_modules/.bin/jasmine

.PHONY: test
