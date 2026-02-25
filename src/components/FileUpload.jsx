import { useState } from "react";
import { motion } from "framer-motion";

export default function FileUpload({ onFilesChange }) {
  const [files, setFiles] = useState([]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const fileNames = selectedFiles.map((f) => f.name);
    setFiles(fileNames);
    onFilesChange(fileNames);
  };

  return (
    <div>
      <motion.label
        whileHover={{ scale: 1.02 }}
        className="block w-full bg-[#1A1A1A] border-2 border-dashed border-brand-red rounded-xl p-6 text-center cursor-pointer hover:bg-[#222222] transition-all"
      >
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="text-brand-red text-4xl mb-2">📁</div>
        <p className="text-white font-semibold">Click to upload files</p>
        <p className="text-white/60 text-sm">or drag and drop</p>
      </motion.label>

      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 space-y-2"
        >
          {files.map((file, index) => (
            <motion.div
              key={index}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-black/50 border border-brand-red rounded-lg p-3 flex items-center"
            >
              <span className="text-brand-red mr-2">✓</span>
              <span className="text-white">{file}</span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
