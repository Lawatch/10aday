# RubyGems / Bundler — Gem::Requirement#satisfied_by?
# A comma-separated constraint is split into several requirements, as in a Gemfile: gem "x", "~> 1.2", ">= 1.2.3"
require 'json'; require 'rubygems'
inp = JSON.parse(File.read('inputs.json'))
res = {}
inp['constraints'].each do |c|
  begin
    r = Gem::Requirement.new(*c.split(',').map(&:strip))
  rescue ArgumentError, Gem::Requirement::BadRequirementError
    res[c] = {valid: false}; next
  end
  m = {}
  inp['versions'].each { |v| m[v] = Gem::Version.correct?(v) ? r.satisfied_by?(Gem::Version.new(v)) : nil }
  res[c] = {valid: true, range: r.to_s, matches: m}
end
puts JSON.pretty_generate({tool: "RubyGems #{Gem::VERSION}", normalized_versions: inp['versions'].to_h { |v| [v, Gem::Version.correct?(v) ? Gem::Version.new(v).to_s : nil] }, results: res})
