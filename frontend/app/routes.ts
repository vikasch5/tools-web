import { type RouteConfig, index, route } from "@react-router/dev/routes";

// Static paths rank above the dynamic :category routes.
export default [
  index("routes/home.tsx"),
  route("tools", "routes/tools.tsx"),
  route("about", "routes/about.tsx"),
  route("help", "routes/help.tsx"),
  route("contact", "routes/contact.tsx"),
  route("privacy", "routes/privacy.tsx"),
  route("terms", "routes/terms.tsx"),
  route(":category", "routes/category.tsx"),
  route(":category/:tool", "routes/tool.tsx"),
] satisfies RouteConfig;
