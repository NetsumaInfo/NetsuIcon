# Security Policy

## Reporting a vulnerability

**Do not open a public issue for a security flaw.**

Use one of these two private channels instead:

- the **Security ▸ Report a vulnerability** tab of the GitHub repository (*private vulnerability
  reporting*);
- a private message to the maintainer from the [NetsumaInfo GitHub profile](https://github.com/NetsumaInfo).

A useful report states what is affected, how to reproduce it, the impact you estimate, and the
commit you ran.

Expect a few days for a first reply. The fix ships before the detailed description of the flaw, and
you are credited if you want to be.

## Scope

NetsuIcon runs on the user's machine: a local server, a web app served next to it, and the agent of
a code editor that calls the server. The areas that matter most:

- the **local server** (`127.0.0.1:6210`): it listens on the loopback interface only and refuses a
  request whose `Host` or `Origin` is not local, so that a web page open in the browser cannot reach
  it. Anything that gets past that check is in scope;
- the **MCP tools**: they write files in the icons folder. Reaching a file outside that folder
  through a name of an icon or of a pack is in scope;
- the **icon document**: the app and the exports turn it into SVG markup that is injected into a
  page. A document that makes the output run a script, or load something from the network, is in
  scope;
- the **exported code** (animated SVG, React component, page of a pack): the same, for the people who
  paste it into their own product.

**Out of scope**:

- what the agent of a code editor does outside these tools, and vulnerabilities in that agent or
  in any upstream dependency: report those to their vendor;
- anything requiring access already obtained on the machine: a local process can call the server by
  design, there is no authentication on the loopback interface.

## Supported versions

Only the latest commit of `main` receives security fixes. NetsuIcon is at its first milestone and
has no published release yet.

## Secrets

The project needs no secret: no account, no key, no remote service. None belongs in the repository.

If you find an exposed secret in the history, report it privately rather than opening an issue.
