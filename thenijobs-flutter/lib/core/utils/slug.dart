String slugify(String input) {
  return input
      .toLowerCase()
      .replaceAll(RegExp(r'[^a-z0-9]+'), '-')
      .replaceAll(RegExp(r'(^-|-$)+'), '');
}
