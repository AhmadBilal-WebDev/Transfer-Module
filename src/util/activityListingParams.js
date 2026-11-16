import moment from "moment";

export function getListingParamsFromSearchParams(searchParams) {
  const dateParam = searchParams.get("date") || searchParams.get("from");
  const parsedDate =
    dateParam && moment(dateParam, "YYYY-MM-DD", true).isValid()
      ? moment(dateParam, "YYYY-MM-DD").format("YYYY-MM-DD")
      : null;

  return {
    city: searchParams.get("city") || "",
    country: searchParams.get("country") || "",
    date: parsedDate,
  };
}

export function buildActivityDetailHref(slug, { city, country, date, language = "en" }) {
  const params = new URLSearchParams();
  if (date) {
    params.set("from", date);
    params.set("to", date);
    params.set("date", date);
  }
  params.set("language", language);
  if (city) params.set("city", city);
  if (country) params.set("country", country);
  return `/activities/${slug}?${params.toString()}`;
}

export function buildListingReturnHref({ city, country, date }) {
  const params = new URLSearchParams();
  if (city) params.set("city", city);
  if (date) params.set("date", date);
  if (country) params.set("country", country);
  const query = params.toString();
  return query ? `/activities?${query}` : "/activities";
}
