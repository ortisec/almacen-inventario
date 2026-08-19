function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-primary-800">{label}</span>
      {children}
    </label>
  )
}

export default Field