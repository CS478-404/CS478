import Autocomplete from "@mui/material/Autocomplete";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import Drawer from "@mui/material/Drawer";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AppBar from "@mui/material/AppBar";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import SellIcon from "@mui/icons-material/Sell";
import { useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

type Props = {
  isLoggedIn: boolean;
  username?: string;
  onOpenUserSettings: () => void;
  meals: {
    id: string;
    strMealThumb: string;
    strTags: string;
    strCategory: string;
    strMeal: string;
  }[];
  ingredients: {
    name: string;
  }[];
  categories: {
    strCategory: string;
  }[];
  areas: {
    strArea: string;
  }[];
  tags: string[];
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onLogout: () => void;
};

const drawerWidth = 280;

function FavoriteIcon() {
  return null;
}

export default function AppLayout({
  isLoggedIn,
  username,
  onOpenUserSettings,
  meals,
  ingredients,
  areas,
  tags,
  categories,
  onLoginClick,
  onRegisterClick,
  onLogout,
}: Props) {
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [page, setPage] = useState<number>(1);
  const [filterResults, setFilterResults] = useState<
    {
      id: string;
      strMealThumb: string;
      strTags: string;
      strCategory: string;
      strMeal: string;
    }[] | null
  >(null);

  const navigate = useNavigate();
  const location = useLocation();
  const itemsPerPage = 24;
  const isHomePage = location.pathname === "/";
  const showFilters = isHomePage;

  const baseMeals = useMemo(() => {
    const src = filterResults ?? (Array.isArray(meals) ? meals : []);
    return Array.isArray(src) ? src : [];
  }, [filterResults, meals]);

  const visibleMeals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return baseMeals;
    return baseMeals.filter((meal) => meal.strMeal.toLowerCase().includes(q));
  }, [baseMeals, searchQuery]);

  const displayedMeals = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return visibleMeals.slice(start, end);
  }, [visibleMeals, page]);

  const searchOptions = useMemo(() => {
    return baseMeals.slice(0, 100).map((meal) => meal.strMeal);
  }, [baseMeals]);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const runSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
    navigate("/");
  };

  const runFilters = async () => {
    let response;
    if (
      selectedIngredients.length === 0 &&
      selectedCategories.length === 0 &&
      selectedAreas.length === 0 &&
      selectedTags.length === 0
    ) {
      response = await fetch("/api/meals");
    } else {
      response = await fetch(
        `/api/meals?ingredients=${selectedIngredients.join(",")}&category=${selectedCategories.join(",")}&area=${selectedAreas.join(",")}&tags=${selectedTags.join(",")}`,
      );
    }

    const data = await response.json();
    setFilterResults(Array.isArray(data) ? data : []);
    setPage(1);
    navigate("/");
  };

  const clearFilters = () => {
    setFilterResults(null);
    setSelectedIngredients([]);
    setSelectedCategories([]);
    setSelectedAreas([]);
    setSelectedTags([]);
    setSearchInput("");
    setSearchQuery("");
    setPage(1);
    navigate("/");
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            onClick={() => navigate("/")}
            sx={{
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
              cursor: "pointer",
              mr: 1,
            }}
          >
            <Box
              component="img"
              src="/cookBooks.png"
              alt="CookBooks"
              sx={{
                display: "block",
                width: { xs: 120, sm: 150, md: 180 },
                height: "auto",
                maxHeight: { xs: 36, sm: 44, md: 52 },
                objectFit: "contain",
              }}
            />
          </Box>

          <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center", minWidth: 0 }}>
            <Autocomplete
              id="meal-search"
              freeSolo
              options={searchOptions}
              filterOptions={(options) => options}
              inputValue={searchInput}
              onInputChange={(_event, value) => setSearchInput(value)}
              onChange={(_event, value) => runSearch(value ?? searchInput)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search meals..."
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      runSearch(searchInput);
                    }
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "rgba(255, 249, 244, 0.95)",
                      borderRadius: 0,
                    },
                    "& .MuiInputLabel-root": {
                      color: "text.secondary",
                    },
                  }}
                />
              )}
              sx={{ width: "100%", maxWidth: 700 }}
            />
          </Box>

          <Box
            sx={{
              flexGrow: 0,
              display: "flex",
              justifyContent: "right",
              gap: 2,
              alignItems: "center",
              minWidth: "fit-content",
            }}
          >
            {isLoggedIn ? (
              <>
                <Typography sx={{ color: "primary.contrastText", fontWeight: 600 }}>
                  Hello, {username}!
                </Typography>
                <Tooltip title="Open settings">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0, borderRadius: 0 }}>
                    <Avatar
                      sx={{
                        bgcolor: "rgba(255,255,255,0.2)",
                        color: "primary.contrastText",
                        borderRadius: 0,
                      }}
                    />
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{ mt: "45px" }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  <MenuItem
                    onClick={() => {
                      handleCloseUserMenu();
                      onOpenUserSettings();
                    }}
                  >
                    <Button variant="text">User Settings</Button>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleCloseUserMenu();
                      navigate("/myrecipes");
                    }}
                  >
                    <Button variant="text">Created Recipes</Button>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleCloseUserMenu();
                      navigate("/favorites");
                    }}
                  >
                    <Button variant="text">My Favorites</Button>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleCloseUserMenu();
                      navigate("/create");
                    }}
                  >
                    <Button variant="text">Create Recipe</Button>
                  </MenuItem>
                  <MenuItem onClick={handleCloseUserMenu}>
                    <Button variant="outlined" color="warning" onClick={onLogout}>
                      Log out
                    </Button>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button variant="contained" onClick={onLoginClick}>
                  Log in
                </Button>
                <Button
                  variant="outlined"
                  onClick={onRegisterClick}
                  sx={{
                    color: "primary.contrastText",
                    borderColor: "rgba(255,255,255,0.55)",
                    "&:hover": {
                      borderColor: "rgba(255,255,255,0.85)",
                      backgroundColor: "rgba(255,255,255,0.08)",
                    },
                  }}
                >
                  Create account
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {showFilters && (
        <Drawer
          variant="permanent"
          anchor="left"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: "border-box",
              borderRadius: 0,
            },
          }}
        >
          <Toolbar />
          <Box sx={{ mt: 1 }}>
            <Typography variant="h6" textAlign="left" marginLeft="10px" sx={{ fontWeight: 800 }}>
              Filter by:
            </Typography>

            <Box component="form">
              <Autocomplete
                multiple
                options={ingredients}
                disableCloseOnSelect
                getOptionLabel={(ingredient) => ingredient.name}
                value={ingredients.filter((ingredient) =>
                  selectedIngredients.includes(ingredient.name),
                )}
                onChange={(_, newValue) => {
                  setSelectedIngredients(newValue.map((ingredient) => ingredient.name));
                  setPage(1);
                }}
                renderOption={(props, option, { selected }) => {
                  const { key, ...optionProps } = props;
                  const SelectionIcon = selected ? CheckBoxIcon : CheckBoxOutlineBlankIcon;

                  return (
                    <li key={key} {...optionProps}>
                      <SelectionIcon
                        fontSize="small"
                        style={{ marginRight: 8, padding: 9, boxSizing: "content-box" }}
                      />
                      {option.name}
                    </li>
                  );
                }}
                style={{ width: 240, margin: "10px" }}
                renderInput={(params) => (
                  <TextField {...params} label="Ingredients" placeholder="Ingredients" />
                )}
              />

              <Autocomplete
                multiple
                options={categories}
                disableCloseOnSelect
                getOptionLabel={(category) => category.strCategory}
                value={categories.filter((category) =>
                  selectedCategories.includes(category.strCategory),
                )}
                onChange={(_, newValue) => {
                  setSelectedCategories(newValue.map((category) => category.strCategory));
                  setPage(1);
                }}
                renderOption={(props, option, { selected }) => {
                  const { key, ...optionProps } = props;
                  const SelectionIcon = selected ? CheckBoxIcon : CheckBoxOutlineBlankIcon;

                  return (
                    <li key={key} {...optionProps}>
                      <SelectionIcon
                        fontSize="small"
                        style={{ marginRight: 8, padding: 9, boxSizing: "content-box" }}
                      />
                      {option.strCategory}
                    </li>
                  );
                }}
                style={{ width: 240, margin: "10px" }}
                renderInput={(params) => (
                  <TextField {...params} label="Category" placeholder="Category" />
                )}
              />

              <Autocomplete
                multiple
                options={areas}
                disableCloseOnSelect
                getOptionLabel={(area) => area.strArea}
                value={areas.filter((area) => selectedAreas.includes(area.strArea))}
                onChange={(_, newValue) => {
                  setSelectedAreas(newValue.map((area) => area.strArea));
                  setPage(1);
                }}
                renderOption={(props, option, { selected }) => {
                  const { key, ...optionProps } = props;
                  const SelectionIcon = selected ? CheckBoxIcon : CheckBoxOutlineBlankIcon;

                  return (
                    <li key={key} {...optionProps}>
                      <SelectionIcon
                        fontSize="small"
                        style={{ marginRight: 8, padding: 9, boxSizing: "content-box" }}
                      />
                      {option.strArea}
                    </li>
                  );
                }}
                style={{ width: 240, margin: "10px" }}
                renderInput={(params) => <TextField {...params} label="Area" placeholder="Area" />}
              />

              <Autocomplete
                multiple
                options={tags}
                disableCloseOnSelect
                getOptionLabel={(tag) => tag}
                value={selectedTags}
                onChange={(_, newValue) => {
                  setSelectedTags(newValue);
                  setPage(1);
                }}
                renderOption={(props, option, { selected }) => {
                  const { key, ...optionProps } = props;
                  const SelectionIcon = selected ? CheckBoxIcon : CheckBoxOutlineBlankIcon;

                  return (
                    <li key={key} {...optionProps}>
                      <SelectionIcon
                        fontSize="small"
                        style={{ marginRight: 8, padding: 9, boxSizing: "content-box" }}
                      />
                      {option}
                    </li>
                  );
                }}
                style={{ width: 240, margin: "10px" }}
                renderInput={(params) => <TextField {...params} label="Tags" placeholder="Tags" />}
              />

              <Button variant="contained" sx={{ margin: "10px" }} onClick={runFilters}>
                Filter
              </Button>

              <Button variant="outlined" sx={{ margin: "10px" }} onClick={clearFilters}>
                Clear
              </Button>
            </Box>
          </Box>
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: showFilters ? `calc(100% - ${drawerWidth}px)` : "100%",
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3 }}>
          {isHomePage ? (
            <>
              <Grid container spacing={2} justifyContent="center" alignItems="flex-start">
                {displayedMeals.map((meal) => {
                  const mealTags = meal.strTags
                    ? meal.strTags
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                    : [];

                  return (
                    <Grid key={meal.id}>
                      <Card
                        sx={{
                          width: 280,
                          height: 360,
                          cursor: "pointer",
                          borderRadius: 0,
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                        }}
                        variant="outlined"
                      >
                        <CardActionArea
                          onClick={() => navigate(`/recipe/${meal.id}`)}
                          sx={{
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "stretch",
                          }}
                        >
                          <CardMedia
                            component="img"
                            sx={{
                              height: 190,
                              width: "100%",
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                            image={meal.strMealThumb}
                            alt={meal.strMeal}
                            loading="lazy"
                          />

                          <CardContent
                            sx={{
                              flexGrow: 1,
                              width: "100%",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              textAlign: "left",
                              gap: 1.5,
                            }}
                          >
                            <Stack spacing={1} sx={{ width: "100%" }}>
                              <Typography
                                variant="h6"
                                component="h2"
                                sx={{
                                  fontWeight: 800,
                                  lineHeight: 1.2,
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                  minHeight: "2.4em",
                                }}
                              >
                                {meal.strMeal}
                              </Typography>

                              <Chip
                                icon={<RestaurantMenuIcon />}
                                label={meal.strCategory || "Uncategorized"}
                                size="small"
                                variant="outlined"
                                sx={{ borderRadius: 0, alignSelf: "flex-start" }}
                              />
                            </Stack>

                            <Stack
                              direction="row"
                              spacing={1}
                              useFlexGap
                              flexWrap="wrap"
                              sx={{ width: "100%" }}
                            >
                              {mealTags.length > 0 ? (
                                mealTags.slice(0, 3).map((tag) => (
                                  <Chip
                                    key={tag}
                                    icon={<SellIcon />}
                                    label={tag}
                                    size="small"
                                    sx={{ borderRadius: 0 }}
                                  />
                                ))
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  No tags
                                </Typography>
                              )}
                            </Stack>
                          </CardContent>
                        </CardActionArea>

                        <CardActions disableSpacing>
                          <IconButton aria-label="add to favorites" sx={{ borderRadius: 0 }}>
                            <FavoriteIcon />
                          </IconButton>
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              <Pagination
                page={page}
                count={Math.ceil(visibleMeals.length / itemsPerPage)}
                onChange={(_, value) => setPage(value)}
                variant="outlined"
                color="primary"
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: 3,
                  "& .MuiPaginationItem-root": {
                    borderColor: "divider",
                    borderRadius: 0,
                  },
                }}
              />
            </>
          ) : (
            <Outlet />
          )}
        </Box>
      </Box>
    </Box>
  );
}
