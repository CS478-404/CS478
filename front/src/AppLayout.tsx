import Autocomplete from "@mui/material/Autocomplete";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Drawer from "@mui/material/Drawer";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AppBar from "@mui/material/AppBar";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { useMemo, useState } from "react";
import { Form, useNavigate } from "react-router-dom";
import Pagination from "@mui/material/Pagination";

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
  let [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  let [searchInput, setSearchInput] = useState<string>("");
  let [searchQuery, setSearchQuery] = useState<string>("");
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
  const itemsPerPage = 24;

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
    return baseMeals.slice(0, 100).map((m) => m.strMeal);
  }, [baseMeals]);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ display: "flex", alignItems: "center" }}>
          <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}>
            <Autocomplete
              id="meal-search"
              freeSolo
              options={searchOptions}
              filterOptions={(x) => x}
              onInputChange={(_event, value) => setSearchInput(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search meals..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setSearchQuery(searchInput);
                    }
                  }}
                />
              )}
              sx={{ width: "100%", color: "white" }}
            />
          </Box>

          <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "right", gap: 2 }}>
            {isLoggedIn ? (
              <>
                <div>Hello, {username}!</div>
                <Tooltip title="Open settings">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar />
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
                  <MenuItem>
                    <Button variant="text">My Recipes</Button>
                  </MenuItem>
                  <MenuItem onClick={() => {
                    handleCloseUserMenu();
                    navigate("/favorites");
                  }}>
                    <Button variant="text">My Favorites</Button>
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
                <Button variant="outlined" onClick={onRegisterClick} sx={{ color: "white" }}>
                  Create account
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        anchor="left"
        sx={{
          width: 260,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: 280, boxSizing: "border-box" },
        }}
      >
        <Box sx={{ marginTop: 9 }}>
          <Typography variant="h6" textAlign="left" marginLeft="10px">
            Filter by:
          </Typography>

          <Form>
            <Autocomplete
              multiple
              options={ingredients}
              disableCloseOnSelect
              getOptionLabel={(ingredient) => ingredient.name}
              value={ingredients.filter((i) => selectedIngredients.includes(i.name))}
              onChange={(_, newValue) => {
                setSelectedIngredients(newValue.map((i) => i.name));
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
              renderInput={(params) => <TextField {...params} label="Ingredients" placeholder="Ingredients" />}
            />

            <Autocomplete
              multiple
              options={categories}
              disableCloseOnSelect
              getOptionLabel={(category) => category.strCategory}
              value={categories.filter((c) => selectedCategories.includes(c.strCategory))}
              onChange={(_, newValue) => {
                setSelectedCategories(newValue.map((c) => c.strCategory));
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
              renderInput={(params) => <TextField {...params} label="Category" placeholder="Category" />}
            />

            <Autocomplete
              multiple
              options={areas}
              disableCloseOnSelect
              getOptionLabel={(area) => area.strArea}
              value={areas.filter((a) => selectedAreas.includes(a.strArea))}
              onChange={(_, newValue) => {
                setSelectedAreas(newValue.map((a) => a.strArea));
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

            <Button
              variant="contained"
              sx={{ margin: "10px" }}
              onClick={async () => {
                let response;
                let data;
                if (
                  selectedIngredients.length === 0 &&
                  selectedCategories.length === 0 &&
                  selectedAreas.length === 0 &&
                  selectedTags.length === 0
                ) {
                  response = await fetch("/api/meals");
                } else {
                  response = await fetch(
                    `/api/meals?ingredients=${selectedIngredients.join(",")}&category=${selectedCategories.join(
                      ",",
                    )}&area=${selectedAreas.join(",")}&tags=${selectedTags.join(",")}`,
                  );
                }
                data = await response.json();
                setFilterResults(Array.isArray(data) ? data : []);
              }}
            >
              Filter
            </Button>

            <Button
              variant="outlined"
              sx={{ margin: "10px" }}
              onClick={() => {
                setFilterResults(null);
                setSelectedIngredients([]);
                setSelectedCategories([]);
                setSelectedAreas([]);
                setSelectedTags([]);
                setSearchInput("");
                setSearchQuery("");
              }}
            >
              Clear
            </Button>
          </Form>
        </Box>
      </Drawer>

      <Box sx={{ width: "100%" }}>
        <Grid container spacing={1} marginTop={10}>
          {displayedMeals.map((meal) => (
            <Grid key={meal.id}>
              <Card sx={{ width: 250, height: 300, cursor: "pointer" }} variant="outlined">
                <CardActionArea onClick={() => navigate(`/recipe/${meal.id}`)}>
                  <CardMedia
                    component="img"
                    sx={{ maxHeight: 200 }}
                    image={meal.strMealThumb}
                    alt={meal.strMeal}
                    loading="lazy"
                  />
                  <CardContent>
                    <Typography
                      component="h1"
                      color="textPrimary"
                      sx={{
                        fontSize: 25,
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                      }}
                    >
                      {meal.strMeal}
                    </Typography>
                    <Typography component="h4" color="textSecondary">
                      {meal.strCategory}
                    </Typography>
                    <Typography component="p" variant="body2" color="textDisabled">
                      {meal.strTags}
                    </Typography>
                  </CardContent>
                </CardActionArea>
                <CardActions disableSpacing>
                  <IconButton aria-label="add to favorites">
                    <FavoriteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
          <Pagination
              page={page}
              count={Math.ceil(visibleMeals.length / itemsPerPage)}
              onChange={(_, value) => setPage(value)}
              variant="outlined"
              sx={{
                  display: "flex", justifyContent: "center", marginTop: 3, "& .MuiPaginationItem-root": {
                      color: "white",
                      borderColor: "white"
                  }, "& .Mui-selected": {
                      backgroundColor: "#1976d2",
                      color: "white",
                      borderColor: "#1976d2"
                  }
              }}
          />
      </Box>
    </Box>
  );
}
