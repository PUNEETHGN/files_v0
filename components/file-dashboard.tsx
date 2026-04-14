"use client";

import { useState, useRef, useEffect } from "react";

interface Category {
  id: string;
  name: string;
  icon: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "land-documents", name: "LandDocuments", icon: "document" },
  { id: "puneeth", name: "Puneeth", icon: "user" },
  { id: "pragathi", name: "Pragathi", icon: "user" },
  { id: "kusuma", name: "Kusuma", icon: "user" },
  { id: "narayana", name: "Narayana", icon: "user" },
];

interface FileItem {
  id: string;
  name: string;
  originalName: string;
  type: string;
  category: string;
  uploadedAt: string;
  fileData?: string;
}

export function FileDashboard() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploadCategory, setUploadCategory] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load files and categories from localStorage on mount
  useEffect(() => {
    const storedFiles = localStorage.getItem("fileManager_files");
    const storedCategories = localStorage.getItem("fileManager_categories");
    const storedLogin = sessionStorage.getItem("fileManager_loggedIn");
    
    if (storedFiles) {
      try {
        setFiles(JSON.parse(storedFiles));
      } catch (e) {
        console.error("Failed to parse stored files:", e);
      }
    }
    
    if (storedCategories) {
      try {
        setCategories(JSON.parse(storedCategories));
      } catch (e) {
        console.error("Failed to parse stored categories:", e);
      }
    }
    
    if (storedLogin === "true") {
      setIsLoggedIn(true);
    }
  }, []);

  // Save files to localStorage whenever they change
  useEffect(() => {
    if (files.length > 0) {
      localStorage.setItem("fileManager_files", JSON.stringify(files));
    }
  }, [files]);

  // Save categories to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("fileManager_categories", JSON.stringify(categories));
  }, [categories]);

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? file.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const getFilesCountByCategory = (categoryId: string) => {
    return files.filter((f) => f.category === categoryId).length;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!fileName) {
        setFileName(file.name.split(".")[0]);
      }
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !fileName.trim() || !uploadCategory) return;

    const extension = selectedFile.name.includes(".")
      ? `.${selectedFile.name.split(".").pop()}`
      : "";

    const reader = new FileReader();
    reader.onload = (e) => {
      const newFile: FileItem = {
        id: crypto.randomUUID(),
        name: fileName.trim() + extension,
        originalName: selectedFile.name,
        type: selectedFile.type || "unknown",
        category: uploadCategory,
        uploadedAt: new Date().toISOString(),
        fileData: e.target?.result as string,
      };

      setFiles((prev) => {
        const updated = [newFile, ...prev];
        localStorage.setItem("fileManager_files", JSON.stringify(updated));
        return updated;
      });
      setIsUploadModalOpen(false);
      setFileName("");
      setUploadCategory("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDelete = (id: string) => {
    if (!isLoggedIn) return;
    setFiles((prev) => {
      const updated = prev.filter((file) => file.id !== id);
      localStorage.setItem("fileManager_files", JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim() || !isLoggedIn) return;
    
    const newCategory: Category = {
      id: newCategoryName.toLowerCase().replace(/\s+/g, "-"),
      name: newCategoryName.trim(),
      icon: "user",
    };
    
    setCategories((prev) => {
      const updated = [...prev, newCategory];
      localStorage.setItem("fileManager_categories", JSON.stringify(updated));
      return updated;
    });
    setNewCategoryName("");
    setIsAddCategoryModalOpen(false);
  };

  const handleLogin = () => {
    if (username === "puneeth" && password === "jarvis5277") {
      setIsLoggedIn(true);
      sessionStorage.setItem("fileManager_loggedIn", "true");
      setIsLoginModalOpen(false);
      setLoginError("");
      setUsername("");
      setPassword("");
    } else {
      setLoginError("Invalid username or password");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem("fileManager_loggedIn");
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    if (type.includes("pdf")) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const getCategoryIcon = (icon: string) => {
    if (icon === "document") {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-foreground">File Manager</h1>
            </div>

            {/* Global Search */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search files..."
                  className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
              </div>
            </div>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedCategory === null ? (
          /* Category Tiles View */
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Categories</h2>
              {isLoggedIn && (
                <button
                  onClick={() => setIsAddCategoryModalOpen(true)}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Category
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className="bg-card border border-border rounded-xl p-6 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:bg-primary/20 transition-colors">
                    {getCategoryIcon(category.icon)}
                  </div>
                  <h3 className="font-medium text-foreground mb-1">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {getFilesCountByCategory(category.id)} files
                  </p>
                </div>
              ))}
            </div>

            {/* Recent Files Section */}
            {files.length > 0 && (
              <div className="mt-10">
                <h2 className="text-xl font-semibold text-foreground mb-6">Recent Files</h2>
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="divide-y divide-border">
                    {files.slice(0, 5).map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                            {getFileIcon(file.type)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {categories.find((c) => c.id === file.category)?.name} - {formatDate(file.uploadedAt)}
                            </p>
                          </div>
                        </div>
                        {isLoggedIn && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(file.id);
                            }}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title="Delete file"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Files View for Selected Category */
          <div>
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Categories
            </button>

            <h2 className="text-xl font-semibold text-foreground mb-6">
              {categories.find((c) => c.id === selectedCategory)?.name}
            </h2>

            {filteredFiles.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No files in this category</h3>
                <p className="text-muted-foreground mb-4">Upload a file to get started</p>
                <button
                  onClick={() => {
                    setUploadCategory(selectedCategory);
                    setIsUploadModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Upload File
                </button>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-secondary/50 text-sm font-medium text-muted-foreground border-b border-border">
                  <div className="col-span-7">Name</div>
                  <div className="col-span-3">Uploaded</div>
                  {isLoggedIn && <div className="col-span-2 text-right">Actions</div>}
                </div>
                <div className="divide-y divide-border">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-secondary/30 transition-colors"
                    >
                      <div className="col-span-7 flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                          {getFileIcon(file.type)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{file.type || "Unknown type"}</p>
                        </div>
                      </div>
                      <div className="col-span-3 text-sm text-muted-foreground">
                        {formatDate(file.uploadedAt)}
                      </div>
                      {isLoggedIn && (
                        <div className="col-span-2 flex justify-end">
                          <button
                            onClick={() => handleDelete(file.id)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title="Delete file"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Login Button - Bottom Right */}
      <div className="fixed bottom-6 right-6 z-50">
        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-lg text-foreground hover:bg-secondary transition-colors shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        ) : (
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Login
          </button>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Upload File</h2>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setFileName("");
                  setUploadCategory("");
                  setSelectedFile(null);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  File Name
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Enter file name"
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Category
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select File
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-foreground">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-muted-foreground mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-muted-foreground">Click to select a file</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-border">
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setFileName("");
                  setUploadCategory("");
                  setSelectedFile(null);
                }}
                className="flex-1 px-4 py-2.5 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || !fileName.trim() || !uploadCategory}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isAddCategoryModalOpen && isLoggedIn && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Add New Category</h2>
              <button
                onClick={() => {
                  setIsAddCategoryModalOpen(false);
                  setNewCategoryName("");
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name"
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddCategory();
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-border">
              <button
                onClick={() => {
                  setIsAddCategoryModalOpen(false);
                  setNewCategoryName("");
                }}
                className="flex-1 px-4 py-2.5 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Login</h2>
              <button
                onClick={() => {
                  setIsLoginModalOpen(false);
                  setLoginError("");
                  setUsername("");
                  setPassword("");
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {loginError && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm">
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleLogin();
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-border">
              <button
                onClick={() => {
                  setIsLoginModalOpen(false);
                  setLoginError("");
                  setUsername("");
                  setPassword("");
                }}
                className="flex-1 px-4 py-2.5 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogin}
                disabled={!username || !password}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
