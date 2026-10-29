export const statuses = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"];
export const label = (value) => value.charAt(0) + value.slice(1).toLowerCase();
export const emptyLead = {
  name: "",
  email: "",
  phone: "",
  company: "",
  service: "Web Development",
  status: "NEW",
  followUpDate: "",
  notes: "",
};
export const services = [
  "Web Development",
  "Mobile App Development",
  "SEO",
  "Social Media Marketing",
  "Paid Advertising",
  "UI/UX Design",
  "Other",
];
