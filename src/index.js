import { useReducer, useEffect, useState } from "react";

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

const buildFetchData = (
  options,
  defaultFormatter = response => response.json(),
  dispatch
) => async ({
  urlProperties,
  body,
  formatter = defaultFormatter,
  onSuccess = () => {},
  onFailure = () => {}
}) => {
  dispatch({ type: ACTIONS.FETCH_INIT });

  try {
    const response = await fetch(buildUrl(urlProperties), { ...options, body });

    if (!response.ok) {
      throw new RequestError(ERROR_MESSSAGES.REQUEST_ERROR, response.status);
    }

    const payload = await formatter(response);

    onSuccess(payload);

    dispatch({ type: ACTIONS.FETCH_SUCCESS, payload });
  } catch (error) {
    onFailure(error);
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

const baseDefaults = {
  baseUrl: "",
  data: null,
  endpoint: "/",
  formatter: response => response.json(),
  isFetchOnLoad: true,
  onFailure: () => {},
  onSuccess: () => {},
  options: { method: "GET" },
  query: {}
};

const createGet = (newDefaults = {}) => {
  const defaults = { ...baseDefaults, ...newDefaults };
  return ({
    baseUrl = defaults.baseUrl,
    data = defaults.data,
    endpoint = defaults.endpoint,
    formatter = defaults.formatter,
    isFetchOnLoad = defaults.isFetchOnLoad,
    onFailure = defaults.onFailure,
    onSuccess = defaults.onSuccess,
    options = defaults.options,
    query = defaults.query
  }) => {
    const [urlProperties, setUrlProperties] = useState({
      baseUrl,
      endpoint,
      query
    });
    const [callbacks, setCallbacks] = useState({ onSuccess, onFailure });
    const [isFetchOnFirstRender, setIsFetchOnRender] = useState(isFetchOnLoad);
    const [state, dispatch] = useReducer(dataFetchReducer, {
      data,
      error: null,
      isLoading: false
    });

    const fetchData = buildFetchData(options, formatter, dispatch);

    useEffect(() => {
      if (isFetchOnFirstRender) {
        fetchData({
          body: null,
          onFailure: callbacks.onFailure,
          onSuccess: callbacks.onSuccess,
          query,
          urlProperties: urlProperties
        });
      } else {
        setIsFetchOnRender(true);
      }
    }, [urlProperties]);

    const doGet = ({ endpoint, query, ...newCallbacks } = {}) => {
      setCallbacks({ ...callbacks, ...newCallbacks });
      setUrlProperties({
        ...urlProperties,
        endpoint: endpoint || urlProperties.endpoint,
        query: getNewQuery(endpoint, query, urlProperties.query)
      });
    };

    return [state, doGet];
  };
};

const get = createGet();

const useFetch = {
  get
};

export { useFetch, createGet };
