/**
 * 
 */

export const parseQueryString = (paramName) => {
    var match = window.location.search.match("[?&]" + paramName + "(?:&|$|=([^&]*))");
    return match ? (match[1] ? decodeURIComponent(match[1]) : "") : null;
}

export const formatNumber = (number) => {
    return (number.toString().length == 1) ? `0${number}` : `${number}`;
}