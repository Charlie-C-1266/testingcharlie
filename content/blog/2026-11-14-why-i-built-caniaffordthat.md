---
title: "Why I'm building CanIAffordThat.co.uk"
date: 2026-11-14
blurb: "The logic and thought behind creating CanIAffordThat.co.uk"
description: "What prompted me to build the website and where I'm headed with it. The decisions made so far and what I hope to do with it"
tags: [Blog, web-development, design]
draft: false
---

[CanIAffordThat.co.uk](https://caniaffordthat.co.uk) is my first attempt at
building a free public tool. I'm guilty of doom-scrolling too often, or trying
to boy-maths my way into justifying some ridiculous purchase that's being
heavily advertised at me at the time. I doubt I'm the only one.

## It started with a BMW M2

In truth, I started putting the tool together to work out just how daft an
idea daily-driving a BMW M2 would be. I knew it would be daft, but **how**
daft? Building the tool was a way to stop writing all the numbers out by hand
every time and actually get to a conclusion.

It'll be no surprise that the dream was short-lived. Even an M240i or M340i
came out with a number that was just a bit too expensive. Thank you, fuel
prices...

But the exercise was useful. Once the finance payment, insurance, fuel, tax and
servicing were all on the same page as my actual take-home pay, the answer was
obvious in a way it never is when you're looking at a "from £399 a month"
advert. That's the gap I wanted to fill.

## Why make it public?

Most of the calculators I found fell into one of three camps:

- **Selling you something.** A finance calculator on a lender's site is there
  to get you to the "apply now" button, not to tell you it's a bad idea.
- **Asking for your details first.** I don't want to hand over an email address
  to find out whether I can afford a holiday.
- **Not built for the UK.** A surprising amount of money advice online is
  American, and US rules of thumb don't map neatly onto UK pay, tax or credit.

I've no interest in storing other peoples data. I don't need it and I'm not paying for the costs associated. The domain was cheap so it began to feel like a no-brainer to make it publicly accessible. 

## What it does

You start by picking a goal from the carousel: a car, a holiday, an emergency
fund, a luxury purchase, or a general "big purchase". These were the common categories that I could think of, 

Each goal asks for the details that matter to it. A car asks how you're paying (cash, PCP, HP or a loan) and what it'll cost to run, while an emergency fund asks how many months of essential spending you want to cover.

Then it asks about your budget: take-home pay, essential outgoings, and what
you already put aside. From there it works out either how long it'd take to
save up, or what the monthly cost would be, and gives you a verdict:
comfortable, a stretch, or not right now.

It also flips the question round and shows the salary you'd need to earn to
afford it comfortably, which is the bit I find most sobering.

## The decisions that shaped it

### UK sources only

Every threshold in the tool is backed by a UK source: MoneyHelper, GOV.UK, the
ONS, Halifax, the RAC and the AA. This sounds obvious, but it caught me out
early on. When I first set the affordability bands I'd calculated them
partly from American rules of thumb, because that's what most "how much should
I spend on a car" articles quote. Swapping the links for UK ones wasn't enough.
I redid the numbers from UK guidance and they changed. The verdict bands are
now anchored to MoneyHelper's figures as a share of take-home pay, with a
second check against how much of your spare cash a commitment eats, so a
stretched budget can't be flattered into "comfortable".

### Show your working

I didn't want to build a black box that says "no" without explaining itself.
Every result links to the sources it used, and there are methodology pages
(starting with
[vehicles](https://caniaffordthat.co.uk/methodology/vehicle/) and
[salary](https://caniaffordthat.co.uk/methodology/salary/)) that walk through
the maths. Every figure, table and chart on those pages is calculated from the
same code the calculator runs, never copied into the page by hand. If I change
the maths, the documentation changes with it. As a tester, documentation that
can't drift out of date is about the most satisfying thing I could build.

### Your numbers stay with you

There's no backend. Everything is calculated in your browser, nothing you type
is sent anywhere, and there are no accounts. If you want to share a result,
the inputs are packed into the link itself.

### Estimates, not advice

It's a calculator, not a financial adviser, and it says so. Where it can't be
precise (a PCP balloon payment estimated from a generic depreciation curve,
for example) it tells you, and it points you to proper help like MoneyHelper,
Citizens Advice and StepChange.

### Open source

The code is [on GitHub](https://github.com/Charlie-C-1266/caniaffordthat), and
it ships with a Docker setup so anyone can run their own copy.

## Built like a tester would build it

My day job is testing, so I couldn't help myself here. The calculator sits at
100% unit test coverage across around 1,200 tests, plus a Playwright suite that
walks through every flow in a real browser. After each release that same suite
runs against the live site. There's even a CI check that fails a pull request
if I write "color" instead of "colour" in a code comment. UK-first means UK-first.

None of that makes the maths right on its own. What it does mean is that once I
*have* got something right, it stays right.

## Where it's headed

It's still wearing an Alpha badge, and that badge comes off when it reaches
v1.0. I still feel like that's a distance away. There is a lot of work still to do and I don't want this to be miscontrued as financial advice. I'm not qualified and this hasn't been verified in any formal capacity.

Some of the things I'd like to try and implement before considering this v1.0:

- **Mortgages.** The card is already in the carousel marked "Soon". It needs a
  proper UK affordability check (deposit, loan-to-value and income multiples)
  rather than a rushed one.
- **Student loan and pension deductions** in the take-home pay sums, so the
  "salary you'd need" figure reflects what actually lands in your account.
- **More methodology pages**, one per goal, so every answer can be checked.

If you give it a go and something looks wrong, or you think it's missing a goal
that matters, [raise an issue](https://github.com/Charlie-C-1266/caniaffordthat/issues)
or email [hello@caniaffordthat.co.uk](mailto:hello@caniaffordthat.co.uk). I'd
genuinely like to hear about it, even if the answer is "you can't afford the
M2 either".
