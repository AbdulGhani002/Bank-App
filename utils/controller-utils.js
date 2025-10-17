function redirectWithError(res, path, error, data) {
  let url = `${path}?error=${encodeURIComponent(error)}`;
  if (data) {
    for (const key in data) {
      if (key !== "password" && key !== "confirmPassword") {
        url += `&${key}=${encodeURIComponent(data[key])}`;
      }
    }
  }
  res.redirect(url);
}

module.exports = {
  redirectWithError,
};
