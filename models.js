const mongoose = require('mongoose');

const storySchema = mongoose.Schema({
    title: {type: String, required: true},
    url: {type: String, required: true},
    votes: {type: Number, required: true, default: 0}
});

storySchema.methods.apiRepr = function() {
    return {
        id: this._id,
        title: this.title,
        url: this.url,
        votes: this.votes
    };
}

const Story = mongoose.model('Story', storySchema);

module.exports = {Story};
