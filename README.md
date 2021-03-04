# Regex to PEG

Type a JavaScript-compatible regex into the text field. Your PEG will appear in the text area below.

As your grammar grows in length, move segments into new rules. You can create as many rules as you want, which provides readibility for even the most complex grammars.

Test your PEG (using JavaScript) here: https://pegjs.org/online

All major languages have their own PEG implementations. The grammar will be identical to the one seen here, but sometimes the delimiters for characters/strings will vary.

https://re2peg.vercel.app/

# todo
* Add more tests
* Improve error handling UX
* Refactor conversion algo to be cleaner and easier to read
* Improve docs/help
* Add PEG tester and/or regex testers to this site (instead of linking out)

# wishlist
* This uses the ECMAScript Regex engine, I would also like to support PCRE
* a PEG analyzer that gives you the time/space estimates for your PEG for different likely inputs
* Add interactive PEG editing features to demonstrate how to add rules/complexity to your PEG