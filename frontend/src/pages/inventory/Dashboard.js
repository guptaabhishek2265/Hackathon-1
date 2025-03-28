import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Grid,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Container,
  alpha,
} from "@mui/material";
import {
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Warning as WarningIcon,
  Save as SaveIcon,
  LocalShipping as SupplierIcon,
  ShoppingCart as PurchaseOrderIcon,
  Add as AddIcon,
  Store as StoreIcon,
  People as PeopleIcon,
  InsertChart as ChartIcon,
  Autorenew as AutorenewIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";

// Import inventory-related components
import StockTable from "../../components/inventory/StockTable";
import LowStockAlert from "../../components/inventory/LowStockAlert";
import StatsCard from "../../components/dashboard/StatsCard";
import RealTimeInventoryMonitor from "../../components/inventory/RealTimeInventoryMonitor";
import DashboardLayout from "../../components/common/DashboardLayout";
import SupplierManagement from "./SupplierManagement";
import PurchaseOrderManagement from "./PurchaseOrderManagement";
import AutoReorderSettings from "../../components/inventory/AutoReorderSettings";

// Create inventory context for real-time updates
export const InventoryContext = React.createContext();

// Particle animation component for cool background effects
const ParticleAnimation = () => {
  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: Math.random() * 100 + "%",
            y: Math.random() * 100 + "%",
            scale: Math.random() * 0.5 + 0.5,
            opacity: Math.random() * 0.3 + 0.1,
          }}
          animate={{
            x: [
              Math.random() * 100 + "%",
              Math.random() * 100 + "%",
              Math.random() * 100 + "%",
              Math.random() * 100 + "%",
            ],
            y: [
              Math.random() * 100 + "%",
              Math.random() * 100 + "%",
              Math.random() * 100 + "%",
              Math.random() * 100 + "%",
            ],
            opacity: [
              Math.random() * 0.3 + 0.1,
              Math.random() * 0.5 + 0.2,
              Math.random() * 0.3 + 0.1,
            ],
          }}
          transition={{
            duration: 20 + Math.random() * 30,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.1)",
            boxShadow: "0 0 20px rgba(255, 255, 255, 0.2)",
            width: 20 + Math.random() * 50 + "px",
            height: 20 + Math.random() * 50 + "px",
          }}
        />
      ))}
    </Box>
  );
};

// Interactive background with img8.webp
const InteractiveBackground = ({ children }) => {
  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        "&::before": {
          content: '""',
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: "url('/images/img8.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          filter: "brightness(0.5) contrast(1.1) saturate(1.2)",
          zIndex: -2,
        },
        "&::after": {
          content: '""',
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "linear-gradient(135deg, rgba(0,20,40,0.8) 0%, rgba(0,60,30,0.7) 100%)",
          zIndex: -1,
        },
      }}
    >
      <ParticleAnimation />
      {children}
    </Box>
  );
};

// Create a provider component
export const InventoryProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    lowStockItems: 0,
  });
  const [autoReorderEnabled, setAutoReorderEnabled] = useState(false);
  const [autoReorderThreshold, setAutoReorderThreshold] = useState(5); // Default threshold
  const [reorderNotifications, setReorderNotifications] = useState([]);

  // Function to update product stock in real-time
  const updateProductStock = (productId, quantityChange) => {
    setProducts((prevProducts) => {
      const updatedProducts = prevProducts.map((product) => {
        if (product.id === productId) {
          const newStock = Math.max(0, product.stock - quantityChange);
          return {
            ...product,
            stock: newStock,
            status: newStock <= product.reorderLevel ? "Low Stock" : "In Stock",
          };
        }
        return product;
      });

      // Update stats
      const newLowStock = updatedProducts.filter(
        (p) => p.stock <= p.reorderLevel
      );
      const newTotalStock = updatedProducts.reduce(
        (sum, p) => sum + p.stock,
        0
      );

      setStats({
        totalProducts: updatedProducts.length,
        totalStock: newTotalStock,
        lowStockItems: newLowStock.length,
      });

      // Check for auto-reorder if enabled
      if (autoReorderEnabled) {
        checkAndCreateAutoReorders(updatedProducts);
      }

      return updatedProducts;
    });
  };

  // Function to check and create automatic reorders
  const checkAndCreateAutoReorders = (currentProducts) => {
    const productsToReorder = currentProducts.filter((product) => {
      // If auto-reorder is enabled, use the autoReorderThreshold
      // Otherwise, use the product's individual reorderLevel
      if (autoReorderEnabled) {
        return product.stock <= autoReorderThreshold;
      } else {
        return (
          product.stock <= product.reorderLevel &&
          product.stock <= autoReorderThreshold
        );
      }
    });

    if (productsToReorder.length > 0) {
      // Create reorder notifications for each product
      const newNotifications = productsToReorder.map((product) => ({
        id: `reorder-${Date.now()}-${product.id}`,
        productId: product.id,
        productName: product.name,
        currentStock: product.stock,
        reorderLevel: autoReorderEnabled
          ? autoReorderThreshold
          : product.reorderLevel,
        reorderQuantity: Math.max(
          autoReorderEnabled
            ? autoReorderThreshold - product.stock + 10
            : product.reorderLevel - product.stock + 10,
          5
        ),
        timestamp: new Date().toISOString(),
        status: "pending",
      }));

      // Add new notifications
      setReorderNotifications((prev) => [...newNotifications, ...prev]);

      // Auto-create purchase orders if enabled
      if (autoReorderEnabled) {
        createAutoPurchaseOrders(productsToReorder);
      }
    }
  };

  // Function to create automatic purchase orders
  const createAutoPurchaseOrders = (productsToReorder) => {
    // Group products by category (in a real system, group by supplier)
    const groupedProducts = productsToReorder.reduce((groups, product) => {
      const category = product.category || "Uncategorized";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(product);
      return groups;
    }, {});

    // For each group, create a purchase order
    Object.entries(groupedProducts).forEach(([category, categoryProducts]) => {
      const orderItems = categoryProducts.map((product) => ({
        productId: product.id,
        name: product.name,
        quantity: Math.max(product.reorderLevel - product.stock + 10, 5),
        price: product.price,
        total:
          product.price *
          Math.max(product.reorderLevel - product.stock + 10, 5),
      }));

      const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0);

      const purchaseOrder = {
        id: `PO-AUTO-${Date.now()}-${category.substr(0, 3)}`,
        date: new Date().toISOString(),
        supplier: `${category} Supplier`,
        status: "Auto-generated",
        totalAmount,
        items: orderItems,
      };

      // Store the purchase order in localStorage
      const purchaseOrders = JSON.parse(
        localStorage.getItem("purchase-orders") || "[]"
      );
      purchaseOrders.push(purchaseOrder);
      localStorage.setItem("purchase-orders", JSON.stringify(purchaseOrders));

      // Update reorder notifications status
      setReorderNotifications((prev) =>
        prev.map((notification) =>
          categoryProducts.some(
            (p) =>
              p.id === notification.productId &&
              notification.status === "pending"
          )
            ? { ...notification, status: "processed" }
            : notification
        )
      );
    });
  };

  // Add a new product
  const addProduct = (productToAdd) => {
    setProducts((prevProducts) => [...prevProducts, productToAdd]);

    // Update stats
    setStats((prevStats) => ({
      ...prevStats,
      totalProducts: prevStats.totalProducts + 1,
      totalStock: prevStats.totalStock + productToAdd.stock,
      lowStockItems:
        productToAdd.stock < productToAdd.reorderLevel
          ? prevStats.lowStockItems + 1
          : prevStats.lowStockItems,
    }));
  };

  // Toggle auto-reorder system
  const toggleAutoReorder = (enabled) => {
    setAutoReorderEnabled(enabled);

    // If enabling, check current inventory for items to reorder
    if (enabled && products.length > 0) {
      checkAndCreateAutoReorders(products);
    }

    // Force update of lowStockItems count in stats
    if (products.length > 0) {
      const lowStock = products.filter((p) => {
        if (enabled) {
          return p.stock <= autoReorderThreshold;
        } else {
          return p.stock <= p.reorderLevel;
        }
      });

      setStats((prevStats) => ({
        ...prevStats,
        lowStockItems: lowStock.length,
      }));
    }
  };

  // Update auto-reorder threshold
  const updateAutoReorderThreshold = (threshold) => {
    const newThreshold = Math.max(1, threshold);
    setAutoReorderThreshold(newThreshold);

    // Update lowStockItems count in stats
    if (products.length > 0) {
      const lowStock = products.filter((p) => {
        if (autoReorderEnabled) {
          return p.stock <= newThreshold;
        } else {
          return p.stock <= p.reorderLevel;
        }
      });

      setStats((prevStats) => ({
        ...prevStats,
        lowStockItems: lowStock.length,
      }));
    }
  };

  // Clear a notification
  const clearReorderNotification = (notificationId) => {
    setReorderNotifications((prev) =>
      prev.filter((n) => n.id !== notificationId)
    );
  };

  // Load products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      // Load products from localStorage if available
      const storedProducts = localStorage.getItem("inventory-products");
      if (storedProducts) {
        const parsedProducts = JSON.parse(storedProducts);
        setProducts(parsedProducts);

        // Calculate stats
        const lowStock = parsedProducts.filter(
          (p) => p.stock <= p.reorderLevel
        );
        const totalStock = parsedProducts.reduce(
          (sum, product) => sum + product.stock,
          0
        );

        setStats({
          totalProducts: parsedProducts.length,
          totalStock: totalStock,
          lowStockItems: lowStock.length,
        });
      }

      // Load auto-reorder settings
      const savedAutoReorderEnabled = localStorage.getItem(
        "auto-reorder-enabled"
      );
      if (savedAutoReorderEnabled !== null) {
        setAutoReorderEnabled(JSON.parse(savedAutoReorderEnabled));
      }

      const savedThreshold = localStorage.getItem("auto-reorder-threshold");
      if (savedThreshold !== null) {
        setAutoReorderThreshold(parseInt(savedThreshold));
      }

      // Load saved notifications
      const savedNotifications = localStorage.getItem("reorder-notifications");
      if (savedNotifications) {
        setReorderNotifications(JSON.parse(savedNotifications));
      }
    };

    fetchProducts();

    // Set up local storage event listener for real-time updates
    const handleStorageChange = (e) => {
      if (e.key === "inventoryUpdate") {
        const updatedProduct = JSON.parse(e.newValue);
        updateProductStock(updatedProduct.id, updatedProduct.quantity);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Save products to localStorage when updated
  useEffect(() => {
    if (products.length > 0) {
      localStorage.setItem("inventory-products", JSON.stringify(products));
    }
  }, [products]);

  // Save auto-reorder settings when changed
  useEffect(() => {
    localStorage.setItem(
      "auto-reorder-enabled",
      JSON.stringify(autoReorderEnabled)
    );
    localStorage.setItem(
      "auto-reorder-threshold",
      autoReorderThreshold.toString()
    );

    // Recalculate low stock items based on new settings
    if (products.length > 0) {
      const lowStock = products.filter((p) => {
        if (autoReorderEnabled) {
          return p.stock <= autoReorderThreshold;
        } else {
          return p.stock <= p.reorderLevel;
        }
      });

      setStats((prevStats) => ({
        ...prevStats,
        lowStockItems: lowStock.length,
      }));
    }
  }, [autoReorderEnabled, autoReorderThreshold, products]);

  // Save notifications when changed
  useEffect(() => {
    localStorage.setItem(
      "reorder-notifications",
      JSON.stringify(reorderNotifications)
    );
  }, [reorderNotifications]);

  // Context value for real-time inventory access across components
  const inventoryContextValue = {
    products,
    updateProductStock,
    addProduct,
    stats,
    autoReorderEnabled,
    autoReorderThreshold,
    reorderNotifications,
    toggleAutoReorder,
    updateAutoReorderThreshold,
    clearReorderNotification,
  };

  return (
    <InventoryContext.Provider value={inventoryContextValue}>
      {children}
    </InventoryContext.Provider>
  );
};

const InventoryManagerDashboard = () => {
  const navigate = useNavigate();
  const inventoryContext = useContext(InventoryContext);

  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState("dashboard"); // dashboard, products, suppliers, purchaseOrders
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  // Add product dialog state
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    category: "",
    price: "",
    stock: "",
    imageUrl: "",
  });

  // Categories - limited to 10 as requested
  const categories = [
    "Shirts",
    "Bastar Art Products",
    "Bottles",
    "Keyrings",
    "Canvas Bags",
    "Stationery",
    "Tribal Art",
    "Jewelry",
    "Handicrafts",
    "Souvenirs",
  ];

  // Update low stock products whenever inventory context changes
  useEffect(() => {
    if (inventoryContext && inventoryContext.products) {
      // When autoReorderEnabled is true, consider products with stock <= autoReorderThreshold as low stock
      // Otherwise, use the product's own reorderLevel
      const lowStock = inventoryContext.products.filter((p) => {
        if (inventoryContext.autoReorderEnabled) {
          return p.stock <= inventoryContext.autoReorderThreshold;
        } else {
          return p.stock <= p.reorderLevel;
        }
      });

      setLowStockProducts(lowStock);
      setLoadingProducts(false);
      setLoadingStats(false);
    }
  }, [inventoryContext]);

  // Update low stock products specifically when auto-reorder settings change
  useEffect(() => {
    if (inventoryContext && inventoryContext.products) {
      console.log(
        "Auto-reorder settings changed. Threshold:",
        inventoryContext.autoReorderThreshold
      );
      console.log("Auto-reorder enabled:", inventoryContext.autoReorderEnabled);

      const lowStock = inventoryContext.products.filter((p) => {
        if (inventoryContext.autoReorderEnabled) {
          return p.stock <= inventoryContext.autoReorderThreshold;
        } else {
          return p.stock <= p.reorderLevel;
        }
      });

      console.log("Low stock products count:", lowStock.length);
      setLowStockProducts(lowStock);
    }
  }, [
    inventoryContext?.autoReorderEnabled,
    inventoryContext?.autoReorderThreshold,
    inventoryContext?.products,
  ]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);

    // If switching to low stock tab, refresh the low stock products list
    if (newValue === 1 && inventoryContext && inventoryContext.products) {
      const lowStock = inventoryContext.products.filter((p) => {
        if (inventoryContext.autoReorderEnabled) {
          return p.stock <= inventoryContext.autoReorderThreshold;
        } else {
          return p.stock <= p.reorderLevel;
        }
      });

      setLowStockProducts(lowStock);
    }
  };

  // Handle opening the add product dialog
  const handleOpenAddProductDialog = () => {
    setAddProductDialogOpen(true);
  };

  // Handle closing the add product dialog
  const handleCloseAddProductDialog = () => {
    setAddProductDialogOpen(false);
    setNewProduct({
      name: "",
      sku: "",
      category: "",
      price: "",
      stock: "",
      imageUrl: "",
    });
  };

  // Handle adding a new product
  const handleAddProduct = () => {
    const productToAdd = {
      id: inventoryContext.products.length + 1,
      ...newProduct,
      price: parseFloat(newProduct.price),
      stock: parseInt(newProduct.stock),
      reorderLevel: Math.floor(parseInt(newProduct.stock) * 0.2), // Set reorder level at 20% of stock
      status:
        parseInt(newProduct.stock) > parseInt(newProduct.stock) * 0.2
          ? "In Stock"
          : "Low Stock",
      imageUrl: newProduct.imageUrl || "https://via.placeholder.com/150",
    };

    // Add the product using context
    inventoryContext.addProduct(productToAdd);

    // Update low stock products if needed
    if (productToAdd.stock < productToAdd.reorderLevel) {
      setLowStockProducts((prev) => [...prev, productToAdd]);
    }

    // Store in localStorage for real-time sync with sales dashboard
    localStorage.setItem("newProductAdded", JSON.stringify(productToAdd));

    // Trigger storage event for other components to react
    const storageEvent = new Event("storage");
    storageEvent.key = "newProductAdded";
    storageEvent.newValue = JSON.stringify(productToAdd);
    window.dispatchEvent(storageEvent);

    // Close the dialog
    handleCloseAddProductDialog();
  };

  // Handle form change for new product
  const handleNewProductChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({
      ...newProduct,
      [name]: value,
    });
  };

  // Handle navigation to specific inventory views
  const handleNavigateToView = (view) => {
    setViewMode(view);
  };

  // Render content based on current view mode
  const renderContent = () => {
    switch (viewMode) {
      case "suppliers":
        return <SupplierManagement />;
      case "purchaseOrders":
        return (
          <PurchaseOrderManagement products={inventoryContext.products || []} />
        );
      default:
        // Default to dashboard view
        return (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={4}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <StatsCard
                    title="Total Products"
                    value={inventoryContext.stats?.totalProducts || 0}
                    icon={<InventoryIcon fontSize="large" />}
                    loading={loadingStats}
                    color="#4caf50"
                  />
                </motion.div>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <StatsCard
                    title="Total Stock"
                    value={inventoryContext.stats?.totalStock || 0}
                    icon={<CategoryIcon fontSize="large" />}
                    loading={loadingStats}
                    color="#2196f3"
                  />
                </motion.div>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <StatsCard
                    title="Low Stock Items"
                    value={lowStockProducts.length || 0}
                    icon={<WarningIcon fontSize="large" />}
                    loading={loadingStats}
                    color="#f44336"
                  />
                </motion.div>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Paper sx={{ mb: 4 }}>
                    <Tabs
                      value={activeTab}
                      onChange={handleTabChange}
                      indicatorColor="primary"
                      textColor="primary"
                      variant="fullWidth"
                    >
                      <Tab label="All Products" />
                      <Tab label="Low Stock" />
                    </Tabs>
                    <Box p={3}>
                      {activeTab === 0 ? (
                        <StockTable
                          products={inventoryContext.products || []}
                          loading={loadingProducts}
                          onEdit={() => {}}
                          onAdd={handleOpenAddProductDialog}
                        />
                      ) : (
                        <LowStockAlert
                          products={lowStockProducts}
                          loading={loadingProducts}
                          onCreatePurchaseOrder={() =>
                            handleNavigateToView("purchaseOrders")
                          }
                        />
                      )}
                    </Box>
                  </Paper>
                </motion.div>
              </Grid>

              <Grid item xs={12} md={4}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <RealTimeInventoryMonitor />
                  <Box mt={3}>
                    <AutoReorderSettings />
                  </Box>
                </motion.div>
              </Grid>
            </Grid>
          </>
        );
    }
  };

  return (
    <InteractiveBackground>
      <DashboardLayout>
        <Container
          maxWidth="xl"
          sx={{
            mt: 3,
            mb: 4,
            backgroundColor: alpha("#0c1e2b", 0.7),
            backdropFilter: "blur(10px)",
            borderRadius: 2,
            padding: 3,
            boxShadow:
              "0 8px 32px rgba(0, 0, 0, 0.3), 0 0 10px rgba(0, 255, 200, 0.1)",
            color: "#fff",
            border: "1px solid rgba(0, 200, 150, 0.1)",
            position: "relative",
            overflow: "hidden",
            zIndex: 1,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background:
                "radial-gradient(circle at top right, rgba(0,200,150,0.1) 0%, transparent 40%)",
              pointerEvents: "none",
              zIndex: -1,
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Box sx={{ mb: 4, display: "flex", alignItems: "center" }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: "bold",
                  color: "#fff",
                  textShadow: "0 0 10px rgba(0, 200, 150, 0.5)",
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <InventoryIcon sx={{ mr: 1, fontSize: 35 }} />
                {viewMode === "dashboard" && "Inventory Dashboard"}
                {viewMode === "suppliers" && "Supplier Management"}
                {viewMode === "purchaseOrders" && "Purchase Orders"}
              </Typography>
            </Box>
          </motion.div>

          <Box sx={{ mb: 4 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 1,
                  borderRadius: 2,
                  backgroundColor: alpha("#001924", 0.5),
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  justifyContent: "center",
                  border: "1px solid rgba(0, 200, 150, 0.2)",
                }}
              >
                <Button
                  variant={viewMode === "dashboard" ? "contained" : "outlined"}
                  startIcon={<ChartIcon />}
                  onClick={() => handleNavigateToView("dashboard")}
                  color="primary"
                  sx={{
                    m: 0.5,
                    borderRadius: 2,
                    boxShadow:
                      viewMode === "dashboard"
                        ? "0 0 15px rgba(0, 200, 150, 0.5)"
                        : "none",
                  }}
                >
                  Dashboard
                </Button>
                <Button
                  variant={viewMode === "suppliers" ? "contained" : "outlined"}
                  startIcon={<SupplierIcon />}
                  onClick={() => handleNavigateToView("suppliers")}
                  color="primary"
                  sx={{
                    m: 0.5,
                    borderRadius: 2,
                    boxShadow:
                      viewMode === "suppliers"
                        ? "0 0 15px rgba(0, 200, 150, 0.5)"
                        : "none",
                  }}
                >
                  Suppliers
                </Button>
                <Button
                  variant={
                    viewMode === "purchaseOrders" ? "contained" : "outlined"
                  }
                  startIcon={<PurchaseOrderIcon />}
                  onClick={() => handleNavigateToView("purchaseOrders")}
                  color="primary"
                  sx={{
                    m: 0.5,
                    borderRadius: 2,
                    boxShadow:
                      viewMode === "purchaseOrders"
                        ? "0 0 15px rgba(0, 200, 150, 0.5)"
                        : "none",
                  }}
                >
                  Purchase Orders
                </Button>
              </Paper>
            </motion.div>
          </Box>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {renderContent()}
          </motion.div>

          {/* Add Product Dialog */}
          <Dialog
            open={addProductDialogOpen}
            onClose={handleCloseAddProductDialog}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Add New Product</DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      name="name"
                      label="Product Name"
                      value={newProduct.name}
                      onChange={handleNewProductChange}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="sku"
                      label="SKU"
                      value={newProduct.sku}
                      onChange={handleNewProductChange}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel id="category-label">Category</InputLabel>
                      <Select
                        labelId="category-label"
                        id="category"
                        name="category"
                        value={newProduct.category}
                        label="Category"
                        onChange={handleNewProductChange}
                      >
                        {categories.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="price"
                      label="Price (₹)"
                      type="number"
                      value={newProduct.price}
                      onChange={handleNewProductChange}
                      fullWidth
                      required
                      InputProps={{
                        startAdornment: (
                          <Box component="span" mr={0.5}>
                            ₹
                          </Box>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="stock"
                      label="Stock"
                      type="number"
                      value={newProduct.stock}
                      onChange={handleNewProductChange}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="imageUrl"
                      label="Image URL"
                      value={newProduct.imageUrl}
                      onChange={handleNewProductChange}
                      fullWidth
                      placeholder="https://example.com/image.jpg"
                      helperText="Optional - Image that will be displayed in the customer dashboard"
                    />
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseAddProductDialog}>Cancel</Button>
              <Button
                onClick={handleAddProduct}
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                disabled={
                  !newProduct.name ||
                  !newProduct.sku ||
                  !newProduct.category ||
                  !newProduct.price ||
                  !newProduct.stock
                }
              >
                Add Product
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </DashboardLayout>
    </InteractiveBackground>
  );
};

export default InventoryManagerDashboard;
