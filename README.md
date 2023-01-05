# pgproxy
Postgresql data proxy on deno. Useful for serverless application architecture

## Usage is simply

By cloning this repo

```sh
$ git clone https://github.com/arisris/pgproxy.git && cd pgproxy && deno run -A main.ts -d postgresql://postgres:postgres@localhost/test -s secretkey -p 8999
```

By https

```sh
$ deno run -A https://raw.githubusercontent.com/arisris/pgproxy/main/main.ts -d postgresql://postgres:postgres@localhost/test -s secretkey -p 8999
```

### Deno deploy

Copy main.js file and paste on playground editor. Edit environtment variable


### Client usage

```sh
$ curl --request POST \
     --url https://your-endpoint.com/query \
     --header "Authorization: Bearer <yourtoken>" \
     --header "Accept: application/json" \
     --header "Content-Type: application/json" \
     --data '{"query":"SELECT * FROM mytable WHERE id = $1;", "args": [1]}'
```

```ts
const response = await fetch("https://your-endpoint.com/query", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "accept": "application/json",
    "authorization": "Bearer <yourtoken>"
  },
  body: JSON.stringify({
    query: "SELECT * FROM mytable WHERE id = $1;",
    args: [1]
  })
})
const data = await response.json();

console.log(data);
```

### Configuration

CLI arguments

```
-p --port = number
-d --dsn = string
-s --secret = string
```

Env

```env
PG_DSN=""
PG_SECRET=""
PORT=""
```

PS: If no cli arguments the env will be used by instead.
WARN: Dont share to public, use it only for internal apps