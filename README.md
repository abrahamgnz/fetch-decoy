# Fetch Decoy
A custom fetch hook for react components.

## Quick Start


```
  const [post, refetchPost] = useFetch({
    	baseUrl: "https://jsonplaceholder.typicode.com",
    	endpoint: "posts/1"
    });
    
  const { data, isLoading, error } = post;
```

## Request with search params


```
  const [post, refetchPost] = useFetch({
    baseUrl: "https://jsonplaceholder.typicode.com",
    endpoint: "posts/1",
    query: { limit: 1 } // This object is parsed into a string and appended to the url
  });
        
  // Fetched url was: https://jsonplaceholder.typicode.com/posts?limit=1
    
  const { data, isLoading, error } = post;
```

## Refetching

```
  const [posts, refetchAll] = useFetch({
    baseUrl: "https://jsonplaceholder.typicode.com",
    endpoint: "posts",
  });
    
  const { data, isLoading, error } = posts;
```

Then: 

```    
<button
  onClick={() => {
  refetchAll({ query: { search: "baseball" }) // Refetch with new search parameters.
  }}
>
  Refetch
</button>
```

## API

### Options

The useFetch hook accepts the following options:

|Options|Type|Default|Description|
|---------|-----|------|--------|
|endpoint|`string`|`"/"`|The path to the resource you want to fetch|
|baseUrl|`string`|`""`|The base URL to use in case endpoint is a relative URL|
|query|`object`|`{}`| The search parameters of the url|
|options|`object`|`{ method: "GET" }`|[Fetch Request options](https://developer.mozilla.org/en-US/docs/Web/API/Request#Properties). Ommit `body` as it is passed as an independent argument to the hook|
|body|`string` or `object`|`null`| The request body|
|bodyParser|`function`|`body => JSON.stringify(body)`| A function that parses the body|
|data| `string` or `object`|`null`| The initial state of data before the fetch, useful for placeholders or initial component render|
|formatter|`function`|`data => data`| A function to format the data extracted from the response|
|extractor|`function`|`res => res.json()`| An function that extracts the body content of a response|
|lazy|`boolean`|`false`|Wether the fetch should be fired on component render|
|onCompleted|`function`|`(data) => {}`|A callback executed once your fetch successfully completes|
|onError|`function`|`(error) => {}`|A callback executed in the event of an error|
|skip|`boolean`|`false`|If skip is true, the fetch will be skipped entirely|

### Result

After being called, the useFetch hook returns an array with two items, the result object and a refetch function:  

#### Result object

The result object has the following properties.

|Properties|Type|Default|Description|
|---------|---|---|---|
|data|`object`|`Defaults to data option` see [Options](###options)|An object containing the result of your fetch|
|error|`object`|`null`|An object containing the error of a failed fetch|
|isLoading|`boolean`|`false`| A boolean that indicates whether the request is in flight|


#### Refetch function

A function for refreshing your fetch result in response to a particular user action.

The refetch function accepts the following optional options:

|Options|Type|Default|Description|
|---------|---|---|---|
|endpoint|`string`|`null`|The path to the resource you want to fetch|
|query|`object`|`null`| The search parameters of the url|
|body|`string` or `null`|`null`| The request body|
