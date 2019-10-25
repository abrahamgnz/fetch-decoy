import { useCallback, useReducer, useEffect, useState } from "react";

const ACTIONS = {
  FETCH_INIT: "FETCH_INIT",
  FETCH_SUCCESS: "FETCH_SUCCESS",
  FETCH_FAILURE: "FETCH_FAILURE"
};

const ERROR_MESSSAGES = {
  REQUEST_ERROR: "There has been a problem with your fetch operation",
  UNKNOWN_ACTION: "Action does not exist for dataFetchReducer"
};

class RequestError extends Error {
  constructor(message, code) {
    super(message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RequestError);
    }

    this.code = code;
  }
}

const dataFetchReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.FETCH_INIT:
      return { ...state, isLoading: true, error: null };
    case ACTIONS.FETCH_SUCCESS:
      return {
        ...state,
        data: action.payload,
        error: null,
        isLoading: false
      };
    case ACTIONS.FETCH_FAILURE:
      return { ...state, isLoading: false, error: action.error };
    default:
      throw new Error(ERROR_MESSSAGES.UNKNOWN_ACTION);
  }
};

const objectIsEmpty = query => query && Object.keys(query).length === 0;

const setUrlSearchParams = (searchParams, query) => {
  for (let key in query) {
    searchParams.set(key, query[key]);
  }
};

const buildUrl = ({ baseUrl, endpoint, query = {} }) => {
  const url = new URL(endpoint, baseUrl);
  setUrlSearchParams(url.searchParams, query);
  return url.toString();
};

const buildFetchData = ({
  bodyParser = body => JSON.stringify(body),
  dispatch = () => {},
  extractor = response => response.json(),
  formatter = data => data,
  onCompleted = () => {},
  onError = () => {},
  options
}) => async ({ requestProps }) => {
  dispatch({ type: ACTIONS.FETCH_INIT });
  const { body: rawBody, ...urlProps } = requestProps;

  const body = rawBody ? bodyParser(rawBody) : null;

  try {
    const response = await fetch(buildUrl(urlProps), {
      ...options,
      body
    });

    if (!response.ok) {
      throw new RequestError(ERROR_MESSSAGES.REQUEST_ERROR, response.status);
    }

    const payload = formatter(await extractor(response));

    onCompleted(payload);

    dispatch({ type: ACTIONS.FETCH_SUCCESS, payload });
  } catch (error) {
    onError(error);
    dispatch({
      type: ACTIONS.FETCH_FAILURE,
      error: { message: error.message, ...error }
    });
  }
};

const getNewQuery = (endpoint, query = {}, oldQuery) => {
  if (endpoint && !query) {
    return {};
  } else if (!objectIsEmpty(query)) {
    return query;
  }
  return oldQuery;
};

const useFetch = ({
  baseUrl = "",
  body = null,
  bodyParser = body => JSON.stringify(body),
  data = null,
  endpoint = "/",
  extractor = response => response.json(),
  formatter = data => data,
  lazy = false,
  onCompleted = () => {},
  onError = () => {},
  options = {},
  query = {},
  skip = false
}) => {
  const [requestProps, setUrlProperties] = useState({
    baseUrl,
    body,
    endpoint,
    lazy,
    query
  });
  const [state, dispatch] = useReducer(dataFetchReducer, {
    data,
    error: null,
    isLoading: false
  });

  const fetchData = useCallback(
    buildFetchData({
      bodyParser,
      dispatch,
      extractor,
      formatter,
      onCompleted,
      onError,
      options: { method: "GET", ...options }
    }),
    []
  );

  useEffect(() => {
    if (!skip && !requestProps.lazy) {
      fetchData({ requestProps });
    }
  }, [fetchData, requestProps, skip]);

  const refetch = ({ endpoint, query, body = null } = {}) => {
    setUrlProperties({
      ...requestProps,
      body: body,
      endpoint: endpoint || requestProps.endpoint,
      lazy: false,
      query: getNewQuery(endpoint, query, requestProps.query)
    });
  };

  return [state, refetch];
};

export { useFetch };
